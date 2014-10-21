'use strict';

var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');
var pjson = require('./package');
var config = require('./config');

var serializers = bunyan.stdSerializers;

var log = bunyan.createLogger({
    name: pjson.name,
    serializers: serializers,
    streams: [
        {
            level: config.log.level,
            stream: process.stdout  // log DEBUG and above to stdout
        },
        {
            level: 'error',
            stream: process.stderr  // log ERROR and above to stderr
        }
    ]
});

module.exports = log;
