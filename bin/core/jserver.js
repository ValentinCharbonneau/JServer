const { Worker, isMainThread, workerData } = require('worker_threads');
const tls = require('tls');
const https = require('https');
const http = require('http');
const fs = require('fs');
const vhost = require('./jserver/vhost.class');
const log = require('./jserver/log')

var _CONFIG = '../../config/';
var vhostListWorker = [];
var routerList = [];
var portUsedList = [];

var vhostFiles = [];

var httpRouterWorker;
var httpsRouterWorker;

var httpDomain = {};
var httpsDomain = [];

// Default configuration values, when the configuration file was incomplete
var httpRouter = 3098;
var httpsRouter = 3099;
var vhostMin = 3000;
var vhostMax = 3097;
var vhostCurrent = vhostMin;

// Function to load configuration
function loadServConfig(callback=null) {
    fs.readFile(_CONFIG+'jserver.conf', 'utf-8', (err, data) => {
        if (err != null) {
            log.log('Config file not found');
            process.exit();
        }
        else {
            let lineNumber = 0;
            data.split('\n').forEach(line => {
                lineNumber++;
                line = line.split('#')[0].split(' ');
                if (line.lenght <= 2) {
                    switch (line[0]) {

                        case 'HTTPROUTER':
                            try {
                                httpRouter = parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""));
                            }
                            catch {
                                log.log('Port : '+parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""))+' in config file is invalid')
                            }

                        case 'HTTPSROUTER':
                            try {
                                httpsRouter = parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""));
                            }
                            catch {
                                log.log('Port : '+parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""))+' in config file is invalid')
                            }

                        case 'VHOSTMIN':
                            try {
                                vhostMin = parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""));
                            }
                            catch {
                                log.log('Port : '+parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""))+' in config file is invalid')
                            }

                        case 'VHOSTMAX':
                            try {
                                vhostMax = parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""));
                            }
                            catch {
                                log.log('Port : '+parseInt(line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, ""))+' in config file is invalid')
                            }
    
                        default:
                            break;
                    }
                }
            });
            if (callback != null) {
                callback();
            }
        }
    });
}

// Function which list all vhost enabled and load vhost configuration for each of them
function listVhost() {
    const exec = require('child_process').exec;
    function puts(error, stdout, stderr) {
        vhostFiles = stdout.split('\n').filter(function(f) { return f !== ' ' }).filter(function(f) { return f !== '' });
        vhostFiles.forEach(file => {
            if (file != '') {
                loadVHostConfig(file, loadVhostWorker);
            }
        });
    }
    exec('ls '+_CONFIG+'sites-enable', puts);
}

// Load vhost configuration
function loadVHostConfig(file, callback=null) {
    console.log(file);
    fs.readFile(_CONFIG+'sites-enable/'+file, "utf-8", (err, data) => {
        let lineNumber = 0;
        let portChanged = false;
        let server = new vhost.vhost();
        let https = false;
        let certif = false;
        let key = false;
        data.split('\n').forEach(line => {
            lineNumber++;
            line = line.split('#')[0].split(' ');
            switch (line[0]) {

                case 'PROTOCOL':
                    try{
                        let protocol = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (protocol == 'https') {
                            server.protocol = 'https';
                            https = true;
                        }
                        else if (protocol != 'http') {
                            log.log('protocol : '+protocol+' to server : '+file+' on config file : '+_CONFIG+file+' at line : '+lineNumber+' isn\'t supported')
                        }
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
                    }
                    break;

                case 'PORT':
                    portChanged = true;
                    let port = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                    try {
                        if (parseInt(port)>=0 && parseInt(port)<=65535) {
                            if (!(parseInt(port)>=vhostMin && parseInt(port)<=vhostMax || parseInt(port) == httpRouter || parseInt(port) == httpsRouter)) {
                                server.port = parseInt(port);
                            }
                            else {
                                log.log('port : '+port.toLowerCase()+' to server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' was used by server in internal, see configuration file \'/etc/jserver/jserver.conf\'')
                            }
                        }
                        else {
                            log.log('port : '+port.toLowerCase()+' to server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t a valid port')
                        }
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
                    }
                    break;

                case 'DOMAIN':
                    try {
                        server.fqdn = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
                    }
                    break;

                case 'FILE':
                    try {
                        let fileServ = line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "");
                        if (fs.existsSync(fileServ)) {
                            if (fileServ[fileServ.length-1] != '/') {
                                server.file = fileServ+'/';
                            }
                            else {
                                server.file = fileServ;
                            }
                        }
                        else {
                            log.log('file : '+fileServ+' of server : '+file+' on config file : '+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist')
                        }
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
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
                            log.log('certificate : '+certifFile+' of server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist')
                        }
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
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
                            log.log('key : '+keyFile+' of server : '+file+' on config file :'+_CONFIG+file+' at line : '+lineNumber+' isn\'t exist')
                        }
                    }
                    catch {
                        log.log('Error on config file :'+_CONFIG+file+' at line : '+lineNumber+' : "'+line[0]+' '+line[line.length-1].toLowerCase().replace(/\n/g, "").replace(/\r/g, "")+'"');
                    }
                    break;

                default:
                    break;
            }
        });
        if (!portChanged) {
            if (server.protocol == 'http') {
                server.port = 80;
            }
            else if (server.protocol == 'https') {
                server.port = 443;
            }
        }
        if ((https && (!certif)) || (https && (!key))) {
            log.log('Server : '+file+' is on https but have not SSL certificate or private key');
        }
        if (https && certif &&  key) {
            httpsDomain[server.fqdn] = server;
        }
        else if (!https) {
            httpDomain[server.fqdn] = server;
        }
        if (((!https) || (https && certif && key)) && callback != null) {
            callback(server);
        }
        
        console.log(server)
    });
}

// Run a worker for a vhost
function loadVhostWorker(server) {
    if (vhostCurrent <= vhostMax) {
        let site = new Worker('./jserver/vhost.worker.js', { workerData: { server : server, port : vhostCurrent } });
        server.internalPort = vhostCurrent;
        vhostListWorker.push(site);
        if (portUsedList.indexOf(server.port) == -1) {
            loadRouterWorker(server.port);
            portUsedList.push(server.port);
        }
        vhostCurrent++;
    }
    else {
        log.log('All internal port was used, server '+server.fqdn+' doesn\'t start');
    }
    let max = vhostMax+1
    if (vhostFiles.length == vhostListWorker.length || vhostCurrent == max) {
        loadHttpHttpsRouter();
        console.log('router start')
    }
}

// Run a worker for a new router, at a new port
function loadRouterWorker(port) {
    let router = new Worker('./jserver/router.worker.js', { workerData: { port : port, http : httpRouter, https : httpsRouter } });
    routerList.push(router);
}

// Run the http router and https router, in distinct worker
function loadHttpHttpsRouter() {
    console.log('https init');
    console.log(httpsDomain);
    httpRouterWorker = new Worker('./jserver/http.worker.js', { workerData: {servers : httpDomain, port : httpRouter } });
    httpsRouterWorker = new Worker('./jserver/https.worker.js', { workerData: {servers : httpsDomain, port : httpsRouter } });
}

// Load server configurations, and then load all vhost (callback)
loadServConfig(listVhost)