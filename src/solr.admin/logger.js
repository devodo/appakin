'use strict';

var fs = require('fs');
var path = require('path');
var config = require('./config');

var winston = require('winston');

// Extend a winston by making it expand errors when passed in as the
// second argument (the first argument is the log level).
function expandErrors(logger) {
    var oldLogFunc = logger.log;
    logger.log = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        if (args.length >= 2 && args[1] instanceof Error) {
            args[1] = args[1].stack;
        }
        return oldLogFunc.apply(this, args);
    };
    return logger;
}

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

module.exports = expandErrors(logger);
