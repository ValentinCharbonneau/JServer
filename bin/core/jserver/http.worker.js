const {parentPort, workerData} = require("worker_threads");
const http = require('http');
const vhost = require('./vhost.class');
const log = require('./log')

http.createServer(function (_REQUEST, _RESPONSE) {
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

        console.log('http : '+_REQUEST.headers.host);
    }
}).listen(workerData.port);

console.log('routeur http');