'use strict';

var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');
var pjson = require('./package');
var config = require('./config');

var winston = require('winston');

var logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            handleExceptions: true,
            json: false,
            prettyPrint: true,
            timestamp: function() {
                var dateNow = new Date();
                return dateNow.toISOString() + ' [' + process.pid + ']';
            },
            level: config.log.level
        })
    ],
    exitOnError: true
});

var serializers = bunyan.stdSerializers;

var log = bunyan.createLogger({
    name: pjson.name,
    serializers: serializers,
    streams: [
        {
            level: config.log.level,
            stream: process.stdout  // log level and above to stdout
        }
    ]
});

//module.exports = log;
module.exports = logger;
