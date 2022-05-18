const {parentPort, workerData} = require("worker_threads");
const https = require('https');
const http = require('http');
const fs = require('fs');
const vhost = require('./vhost.class');

console.log(workerData);