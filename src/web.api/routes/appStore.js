'use strict';
var https = require('https');
var cheerio = require('cheerio');
var fs = require('fs');

exports.init = function init(app) {

    app.post('/api/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        getPageSrc(id, function(err, pageSrc) {

            console.log(pageSrc);

            res.json({status: 'success'});
        });
    });
};

var parseHtml = function(pageSrc) {

};

var tempGetAppStorePage = function(id, next) {
    fs.readFile('/etc/hosts', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        console.log(data);
    });
};

var getPageSrc = function(id, next) {

    var options = {
        hostname: 'itunes.apple.com',
        port: 443,
        path: '/us/app/' + id,
        method: 'GET'
    };

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

    var req = https.request(options, callback);

    req.setTimeout(20000, function() {
        console.error("Request timed out: " + options.path);
        isTimedOut = true;
        req.abort();
    });

    req.on('error', function(e) {
        next(e.message);
    });

    req.end();
};

exports.getPageSrc = getPageSrc;


