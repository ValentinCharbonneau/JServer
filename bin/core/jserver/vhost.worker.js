const {parentPort, workerData} = require("worker_threads");
const https = require('https');
const http = require('http');
const fs = require('fs');
const vhost = require('./vhost.class');
const log = require('./log')

http.createServer(function (_REQUEST, _RESPONSE) {
    if (_REQUEST.headers.host == workerData.server.fqdn) {
        try {
            require(workerData.server.file+'index.js');
        }
        catch {
            _RESPONSE.statusCode = 500;
            log.log('Enter point \'index.js\' of server : '+workerData.server.fqdn+' was not found');
        }
        _RESPONSE.end();
    }
}).listen(workerData.port);

console.log('worker start');