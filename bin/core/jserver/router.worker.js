const {parentPort, workerData} = require("worker_threads");
const log = require('./log')
const net = require('net');

net.createServer(function (conn) {
    conn.once('data', function (buf) {
        // A TLS handshake record starts with byte 22.
        var address = (buf[0] === 22) ? workerData.https : workerData.http;
        var proxy = net.createConnection(address, function () {
            proxy.write(buf);
            conn.pipe(proxy).pipe(conn);
        });
    });
}).listen(workerData.port);

console.log(workerData);