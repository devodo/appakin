'use strict';

var debug = require('debug')('web.api');
var app = require('./app');

app.set('port', process.env.PORT || 3003);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
