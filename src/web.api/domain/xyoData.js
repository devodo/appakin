'use strict';
var https = require('https');
var http = require('http');
var cheerio = require('cheerio');
var async = require('async');
var log = require('../logger');

var callHistory = [];
var callHistoryWindowMinutes = 1;
var maxCallsPerSecond = 2;

var getRequest = function(options, next, retries) {
    var markDate = new Date();
    markDate.setMinutes(markDate.getMinutes() - callHistoryWindowMinutes);
    while (callHistory.length > 0 && callHistory[0] < markDate) {
        callHistory.shift();
    }

    var dateNow = new Date();
    if (callHistory.length > 0) {
        var diff = dateNow.getTime() - callHistory[0].getTime();
        var rate = (callHistory.length * 1000) / diff;

        if (callHistory.length > 10 && rate >= maxCallsPerSecond) {
            setTimeout(function() {
                getRequest(options, next, retries);
            }, 50);

            return;
        }
    }

    callHistory.push(new Date());

    var isTimedOut = false;

    var callback = function(response) {
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

    var req = http.request(options, callback);

    req.setTimeout(20000, function() {
        log.error("Request timed out: " + options.path);
        isTimedOut = true;
        req.abort();
    });

    req.on('error', function(e) {
        if (retries && retries > 0) {
            log.error(e.message);
            log.debug("Retrying request...");
            return getRequest(options, next, retries - 1);
        }

        return next(e.message);
    });

    req.end();
};

var crawl = function(limit, next) {

    var options = {
        hostname: 'xyo.net',
        port: 80,
        path: '/iphone-apps',
        method: 'GET'
    };

    var callback = function(err, pageSrc) {
        var $ = cheerio.load(pageSrc);
        var categoryLink = $(".interest-box");
        next(null, limit);
    };

    getRequest(options, callback, 5);
};


exports.crawl = crawl;


