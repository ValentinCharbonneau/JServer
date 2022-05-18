const { Worker, isMainThread, workerData } = require('worker_threads')
const https = require('https');
const http = require('http');
const fs = require('fs');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Hello World!');
    res.end();
    console.log(req.headers);
}).listen(80);

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('Second server');
    res.end();
    console.log(req.headers);
    console.log(req.method);
    console.log(req.url);
    console.log('\n');
}).listen(8081);

console.log('ok');

// const exec = require('child_process').exec;
// function puts(error, stdout, stderr) {
//     message.channel.send(stdout);
// }

// exec('ls');