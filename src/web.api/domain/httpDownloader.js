'use strict';
var https = require('https');
var http = require('http');
var log = require('../logger');

var downloadHttpInternal = function(options, retries, isSecure,
                                    callHistory, avgWindowSeconds,
                                    maxCallsPerSecond, next) {

    var markDate = new Date();
    markDate.setSeconds(markDate.getSeconds() - avgWindowSeconds);
    while (callHistory.length > 0 && callHistory[0] < markDate) {
        callHistory.shift();
    }

    var dateNow = new Date();
    if (callHistory.length > 0) {
        var diff = dateNow.getTime() - callHistory[0].getTime();
        var rate = (callHistory.length * 1000) / diff;

        if (callHistory.length > 10 && rate >= maxCallsPerSecond) {
            setTimeout(function () {
                getRequest(options, next, retries);
            }, 50);

            return;
        }
    }

    callHistory.push(new Date());

    var isTimedOut = false;

    var callback = function (response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            if (isTimedOut) {
                return next("Request timed out");
            }

            next(null, str);
        });
    };

    var req = isSecure ? https.request(options, callback) : http.request(options, callback);

    req.setTimeout(20000, function () {
        log.warn("Request timed out: " + options.path);
        isTimedOut = true;
        req.abort();
    });

    req.on('error', function (e) {
        if (retries && retries > 0) {
            log.warn(e.message);
            log.warn("Retrying request. Retries remain: " + retries);
            return downloadHttpInternal(
                options, retries - 1, isSecure,
                callHistory, avgWindowSeconds,
                maxCallsPerSecond, next);
        }

        return next(e.message);
    });

    req.end();
};

var Instance = function(avgWindowSeconds, maxCallsPerSecond, retries) {
    var callHistory = [];

    var downloadHttpWrapper = function(options, isSecure, next) {
        downloadHttpInternal(options, retries, isSecure, callHistory, avgWindowSeconds, maxCallsPerSecond, next);
    };

    this.downloadHttp = function(options, next) {
        downloadHttpWrapper(options, false, next);
    };

    this.downloadHttps = function(options, next) {
        downloadHttpWrapper(options, true, next);
    };
};

exports.create = function(avgWindowSeconds, maxCallsPerSecond, retries) {
    if (!avgWindowSeconds) {
        avgWindowSeconds = 60;
    }

    if (!maxCallsPerSecond) {
        maxCallsPerSecond = 5;
    }

    if (!retries) {
        retries = 3;
    }

    return new Instance(avgWindowSeconds, maxCallsPerSecond, retries);
};




