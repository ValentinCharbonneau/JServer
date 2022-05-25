const {parentPort, workerData} = require("worker_threads");
const https = require('https');
const http = require('http');
const tls = require('tls');
const fs = require('fs');
const vhost = require('./vhost.class');
const log = require('./log')

const options = {
    SNICallback: function(domain, cb) {
        if (workerData.servers.hasOwnProperty(domain)) {
            cb(null, tls.createSecureContext({
                        key: fs.readFileSync(workerData.servers[domain].key).toString(),
                        cert: fs.readFileSync(workerData.servers[domain].certificate).toString()
                    })
            );
        }
        else {
            cb();
        }
    }
}

https.createServer(options, function (_REQUEST, _RESPONSE) {
    if (workerData.servers.hasOwnProperty(_REQUEST.headers.host)) {
        var options = {
            hostname: 'localhost',
            port: workerData.servers[_REQUEST.headers.host].internalPort,
            path: _REQUEST.url,
            method: _REQUEST.method,
            headers: _REQUEST.headers
        };
        
        var proxy = http.request(options, function (res) {
            _RESPONSE.writeHead(res.statusCode, res.headers)
            res.pipe(_RESPONSE, {
                end: true
            });
        });
        
        _REQUEST.pipe(proxy, {
            end: true
        });
    }
}).listen(workerData.port);

console.log('routeur https');