'use strict';
var https = require('https');
var cheerio = require('cheerio');
var appakinRepo = require("../repos/appakin.js");

exports.init = function init(app) {

    app.post('/api/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        getLookup(id, function(err, data) {

            res.json({status: 'success'});
        });
    });
};

var getRequest = function(options, next) {
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

var getPageSrc = function(id, next) {

    var options = {
        hostname: 'itunes.apple.com',
        port: 443,
        path: '/us/app/id' + id,
        method: 'GET'
    };

    getRequest(options, next);
};

var parseHtml = function(pageSrc, next) {
    var $ = cheerio.load(pageSrc);
    var title = $('h1').text();

    var result = {
        title: title
    };

    next(null, result);
};

var getLookup = function(id, next) {

    var options = {
        hostname: 'itunes.apple.com',
        port: 443,
        path: '/lookup?id=' + id,
        method: 'GET'
    };

    var callback = function(err, data) {

        if (err) {
            return next(err);
        }

        try {
            var result = JSON.parse(data);

            if (!result.resultCount || result.resultCount === 0) {
                return next("No result found");
            }

            if (result.results[0].kind !== "software") {
                return next("iTunes item found but is not an app");
            }

            next(null, result.results[0]);
        } catch (ex) {
            return next(ex);
        }
    };

    getRequest(options, callback);
};

var parseLookup = function(data, next) {
    var result = {
        name: data.trackName,
        storeItemId: data.trackId,
        censoredName: data.trackCensoredName,
        description: data.description,
        appStoreUrl: data.trackViewUrl,
        devId: data.artistId,
        devName: data.artistName,
        devUrl: data.artistViewUrl,
        features: data.features,
        supportedDevices: data.supportedDevices,
        isGameCenterEnabled: data.isGameCenterEnabled,
        screenShotUrls: data.screenshotUrls,
        ipadScreenShotUrls: data.ipadScreenshotUrls,
        artworkSmallUrl: data.artworkUrl60,
        artworkMediumUrl: data.artworkUrl100,
        artworkLargeUrl: data.artworkUrl512,
        price: data.price,
        currency: data.currency,
        version: data.version,
        primaryGenre: data.primaryGenreName,
        genres: data.genres,
        releaseDate: data.releaseDate,
        bundleId: data.bundleId,
        sellerName: data.sellerName,
        releaseNotes: data.releaseNotes,
        minOsVersion: data.minimumOsVersion,
        languageCodes: data.languageCodesISO2A,
        fileSizeBytes: data.fileSizeBytes,
        advisoryRating: data.contentAdvisoryRating,
        contentRating: data.trackContentRating,
        userRatingCurrent: data.averageUserRatingForCurrentVersion,
        ratingCountCurrent: data.userRatingCountForCurrentVersion,
        userRating: data.averageUserRating,
        ratingCount: data.userRatingCount
    };

    next(null, result);
};

var retrieveApp = function(id, next) {
    getLookup(id, function(err, data) {
        if (err) {
            return next(err);
        }

        parseLookup(data, function(err, app) {
            if (err) {
                return next(err);
            }

            appakinRepo.insertAppStoreItem(app, function(err, itemId) {
                if (err) {
                    return next(err);
                }

                next(null, itemId);
            });
        });
    });
};

exports.getPageSrc = getPageSrc;
exports.parseHtml = parseHtml;
exports.getLookup = getLookup;
exports.parseLookup = parseLookup;
exports.retrieveApp = retrieveApp;


