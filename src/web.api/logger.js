'use strict';

var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');
var pjson = require('./package');

var logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

function getFullStack(err) {
    var ret = err.stack || err.toString(),
        cause;

    if (err.cause && typeof(err.cause) === 'function') {
        cause = err.cause();
        if (cause) {
            ret += '\nCaused by: ' + getFullStack(cause);
        }
    }
	
    return ret;
};

// TODO: Look again at what to do about these serializers.
// Express-bunyan-logger does a good job of outputting this info 
// without relying on req and res serialization, so it seems a bit
// pointless to use them.
var serializers = {
    req: function reqSerializer(req) {
        return null;
    },
    res: function resSerializer(res) {
        return null;
    },
    err: function errSerializer(err) {
        if (!err || !err.stack) {
            return err;
        }

        return {
            message: err.message,
            name: err.name,
            stack: getFullStack(err),
            code: err.code,
            signal: err.signal,
            requestId: err.requestId
        };
    }
};

var log = bunyan.createLogger({
    name: pjson.name,
    serializers: serializers,
    streams: [{
        stream: process.stderr,
        level: 'debug'
    }, {
        type: 'rotating-file',
        path: './logs/'+pjson.name+'.log',
        period: '1d', // daily rotation
        count: 3      // keep 3 back copies
    }]
});

log.level('debug');

module.exports = log;
