const { Worker, isMainThread, workerData } = require('worker_threads')
const https = require('https');
const http = require('http');
const net = require('net');
const fs = require('fs');

var baseAddress = 3000;
var redirectAddress = 3001;
var httpsAddress = 3002;
var httpsOptions = {
    key: fs.readFileSync('/home/vagrant/ssl/key.pem'),
    cert: fs.readFileSync('/home/vagrant/ssl/cert.pem')
};

net.createServer(tcpConnection).listen(baseAddress);
http.createServer(httpConnection).listen(redirectAddress);
https.createServer(httpsOptions, httpsConnection).listen(httpsAddress);

function tcpConnection(conn) {
    conn.once('data', function (buf) {
        // A TLS handshake record starts with byte 22.
        var address = (buf[0] === 22) ? httpsAddress : redirectAddress;
        var proxy = net.createConnection(address, function () {
            proxy.write(buf);
            conn.pipe(proxy).pipe(conn);
        });
    });
}

function httpConnection(req, res) {
    console.log(req.headers.host);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('HTTP');
    res.end();
}

function httpsConnection(req, res) {
    console.log(req.headers.host);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('HTTPS');
    res.end();
}

