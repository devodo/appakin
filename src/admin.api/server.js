'use strict';

var argv = require('yargs').argv;
var config = require('./config');
var log = require('./logger');
var app = require('./app');

var port = argv.port ? argv.port : config.server.port;
app.set('port', port);

var server = app.listen(app.get('port'), function() {
    log.info('Appakin admin.api server listening on port ' + server.address().port);
});
