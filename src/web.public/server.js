'use strict';

var debug = require('debug')('web.public');
var app = require('./app');

app.set('port', process.env.PORT || 3009);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
