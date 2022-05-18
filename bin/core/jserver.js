const { Worker, isMainThread, workerData } = require('worker_threads')
const https = require('https');
const http = require('http');
const fs = require('fs');
const vhost = require('./jserver/vhost.class');

var _CONFIG = '../../config/';
var sites = [];

function log(event) {
    fs.appendFile("../../log/jserver.log", event, (err) => {
        if (err) console.log(err);
    });
}

function readVhostConf(file, callback) {
    fs.readFile(_CONFIG+'sites-enable/'+file, "utf-8", (err, data) => {
        let lineNumber = 0;
        let portChanged = false;
        let server = new vhost.vhost();
        let https = false;
        let certif = false;
        let key = false;
        data.split('\n').forEach(line => {
            lineNumber++;
            line = line.split(' ');
            switch (line[0]) {

                case 'PROTOCOL':
                    try{
                        let protocol = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (protocol == 'https') {
                            server.protocol = 'https';
                            https = true;
                            if (!portChanged) {
                                server.port = 443;
                            }
                        }
                        else if (protocol != 'http') {
                            log('protocol : '+protocol+' to server : '+file+' on config file : '+_CONFIG+file+' at line : '+lineNumber+' isn\'t supported\n')
                        }
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                case 'PORT':
                    portChanged = true;
                    let port = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                    try {
                        if (parseInt(port)>=0 && parseInt(port)<=65535) {
                            server.port = parseInt(port);
                        }
                        else {
                            log('port : '+port.toLowerCase()+' to server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t a valid port\n')
                        }
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                case 'DOMAIN':
                    try {
                        server.fqdn = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                case 'FILE':
                    try {
                        let fileServ = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (fs.existsSync(fileServ)) {
                            server.file = fileServ;
                        }
                        else {
                            log('file : '+fileServ+' of server : '+file+' on config file : '+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist\n')
                        }
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                case 'CERTIFICATE':
                    try {
                        let certifFile = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (fs.existsSync(certifFile)) {
                            server.certificate = certifFile;
                            certif = true;
                        }
                        else {
                            log('certificate : '+certifFile+' of server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist\n')
                        }
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                case 'CERTIFICATEKEY':
                    try {
                        let keyFile = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (fs.existsSync(keyFile)) {
                            server.key = keyFile;
                            key = true;
                        }
                        else {
                            log('key : '+keyFile+' of server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist\n')
                        }
                    }
                    catch {
                        log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"\n');
                    }
                    break;

                default:
                    break;
            }
        });
        if ((https && (!certif)) || (https && (!key))) {
            log('Server : '+file+' is on https but have not SSL certificate or private key\n');
        }
        else {
            callback(server);
        }
    });
}

function createWorker(server) {
    let site = new Worker('./jserver/vhost.worker.js', { workerData: server });
    sites.push(site);
}

const exec = require('child_process').exec;
function puts(error, stdout, stderr) {
    stdout.split('\n').forEach(file => {
        if (file != '') {
            readVhostConf(file, createWorker);
        }
    });
}

exec('ls '+_CONFIG+'sites-enable', puts);

// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     res.write('Hello World!');
//     res.end();
//     console.log(req.headers);
// }).listen(80);

// http.createServer(function (req, res) {
//     res.writeHead(200, {'Content-Type': 'text/plain'});
//     res.write('Second server');
//     res.end();
//     console.log(req.headers);
//     console.log(req.method);
//     console.log(req.url);
//     console.log('\n');
// }).listen(8081);
