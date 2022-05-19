const {parentPort, workerData} = require("worker_threads");
const https = require('https');
const http = require('http');
const fs = require('fs');
const vhost = require('./vhost.class');
const log = require('./log')

// http server
if (workerData.protocol == 'http') {
    try {
        http.createServer(function (_REQUEST, _RESPONSE) {
            if (_REQUEST.headers.host == workerData.fqdn) {
                try {
                    require(workerData.file+'index.js');
                }
                catch {
                    _RESPONSE.statusCode = 500;
                    log.log('Enter point \'index.js\' of server : '+workerData.fqdn+' was not found');
                }
                _RESPONSE.end();
                console.log(workerData.fqdn);
            }
        }).listen(workerData.port);
    }
    catch {
        log.log('Start of server : '+workerData.fqdn+' was failed');
    }
    
}


// https server
else if (workerData.protocol == 'https') {
    try {
        const options = {
            key: fs.readFileSync(workerData.key),
            cert: fs.readFileSync(workerData.certificate)
        };
        try {
            https.createServer(options, function (_REQUEST, _RESPONSE) {
                if (_REQUEST.headers.host == workerData.fqdn) {
                    try {
                        require(workerData.file+'index.js');
                    }
                    catch {
                        _RESPONSE.statusCode = 500;
                        log.log('Enter point \'index.js\' of server : '+workerData.fqdn+' was not found');
                    }
                    _RESPONSE.end();
                }
            }).listen(workerData.port);
        }
        catch (error) {
            log.log('Start of server : '+workerData.fqdn+' was failed');
        }
    }
    catch {
        log.log("Certificate or private key of "+workerData.fqdn+" doesn't be read");
    }
}
else {
    log.log("Error for web site : "+workerData.fqdn+" unknown protocol");
}

console.log(workerData);