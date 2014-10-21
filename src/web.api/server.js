'use strict';

var cluster = require('cluster');
var config = require('./config');
var log = require('./logger');

if (config.server.cluster.enabled && cluster.isMaster) {
    var numWorkers = config.server.cluster.workers;

    if (numWorkers === 'cpu_count') {
        numWorkers = require('os').cpus().length;
    }

    log.info('Cluster master started. Forking ' + numWorkers + ' workers');

    // Fork workers.
    for (var i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        log.warn('Worker ' + worker.process.pid + ' died');
        cluster.fork();
    });
}
else {
    var app = require('./app');
    var port = config.server.port;
    app.set('port', port);

    var server = app.listen(app.get('port'), function() {
        log.info('Worker ' + process.pid + ' started.');
        log.debug('Express server listening on port ' + server.address().port);
    });
}
