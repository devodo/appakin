'use strict';

var fs = require('fs');
var path = require('path');
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

module.exports = logger;
