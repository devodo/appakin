'use strict';

var config = require('./config');
var log = require('./logger');
var app = require('./app');

var port = config.server.port;
app.set('port', port);

var server = app.listen(app.get('port'), function() {
    log.info('Express server listening on port ' + server.address().port);
});
