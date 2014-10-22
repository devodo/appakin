'use strict';

var recluster = require('recluster');
var path = require('path');
var fs = require('fs');
var config = require('./config');
var log = require('./logger');

function killAll(signal) {
    log.info('Received ' + signal  + ' signal, signalling all worker processes...');
    process.kill(0, signal);
}

var numWorkers = config.cluster.workers;

if (numWorkers === 'cpu_count') {
    numWorkers = require('os').cpus().length;
}

var opts = {
    timeout: 30,
    respawn: 60,
    workers: numWorkers
};


var cluster = recluster(path.join(__dirname, 'server.js'), opts);

var sighupSent = false;
process.on('SIGHUP', function(){
    if(!sighupSent) {
        sighupSent = true;
        killAll('SIGHUP');
        setTimeout(function() {
            sighupSent = false;
        }, 30000);
    }
});

process.on('SIGUSR2', function() {
    log.info('Restart signal received, reloading instances');
    cluster.reload();
});

process.on('SIGTERM', function(){
    log.info('TERM signal received, shutting down instances');
    cluster.terminate();
});

/**
 * Monitor the specified file for restart. If that file
 * is modified, shut down the current process instance.
 */
var restartFile = config.cluster.watchFile;
fs.watchFile(restartFile, function(curr, prev) {
    log.info('Restart signal received, reloading instances');
    cluster.reload();
});

cluster.run();

log.info("spawned cluster, kill -s SIGUSR2", process.pid, "to reload");
