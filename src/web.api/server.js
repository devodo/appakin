'use strict';

var cluster = require('cluster');
var config = require('./config');
var log = require('./logger');
var app = require('./app');

var port = config.server.port;
app.set('port', port);

var server = app.listen(app.get('port'), function() {
    log.info('Worker ' + process.pid + ' started.');
    log.debug('Express server listening on port ' + server.address().port);
});
