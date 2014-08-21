'use strict';
var https = require('https');
var cheerio = require('cheerio');
var async = require('async');
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

var retrieveCategories = function(next) {
    var options = {
        hostname: 'itunes.apple.com',
        port: 443,
        path: '/us/genre/ios/id36?mt=8',
        method: 'GET'
    };

    var callback = function(err, pageSrc) {
        if (err) {
            return next(err);
        }

        var idRegex = /id([\d]+)/;
        var $ = cheerio.load(pageSrc);
        var tasks = $('#genre-nav a').map(function(i, el) {
            var url = $(this).attr('href');
            var name = $(this).text();
            var match = idRegex.exec(url);
            var id = match[1];

            var category = {
                id: id,
                url: url,
                name: name
            };

            return function(callback) {
                appakinRepo.insertAppStoreCategory(category, function(err, id) {
                    callback(err, id);
                });
            };
        });

        async.series(tasks, function(err, results) {
            next(err, results);
        });
    };

    getRequest(options, callback);
};

var retrieveItemSources = function(category, startLetter, startPageNumber, next) {
    var idRegex = /id([\d]+)/;

    var retrievePage = function(letterCode, pageNumber) {
        var letter = String.fromCharCode(letterCode);
        var url = category.storeUrl + '&letter=' + letter + '&page=' + pageNumber;

        var options = {
            hostname: 'itunes.apple.com',
            port: 443,
            path: url,
            method: 'GET'
        };

        var callback = function(err, pageSrc) {
            if (err) {
                return next(err);
            }

            var $ = cheerio.load(pageSrc);

            var itemSources = $('#selectedcontent a').map(function(i, el) {
                var url = $(this).attr('href');
                var name = $(this).text();
                var match = idRegex.exec(url);
                var id = match[1];

                var itemSrc = {
                    categoryId: category.id,
                    appStoreId: id,
                    name: name,
                    letter: letter,
                    pageNumber: pageNumber
                };

                return itemSrc;
            });

            var tasksMap = itemSources.map(function(i, itemSrc) {
                return function(callback) {
                    console.log(itemSrc.name);
                    appakinRepo.insertAppStoreItemSrc(itemSrc, function(err, id) {
                        callback(err, id);
                    });
                };
            });

            var tasks = [];

            for (var i = 0; i < tasksMap.length; i++) {
                tasks.push(tasksMap[i]);
            }

            async.series(tasks, function(err, results) {
                if (err) {
                    return next(err);
                }

                var hasNew = false;
                for (var i = 0; i < results.length; i++) {
                    if (results[i] > 0) {
                        hasNew = true;
                        break;
                    }
                }

                if (hasNew) {
                    return retrievePage(letterCode, pageNumber+1);
                }

                if (letterCode < 90) {
                    return retrievePage(letterCode+1, 1);
                }

                next();
            });
        };

        getRequest(options, callback);
    };

    var startLetterCode = startLetter.charCodeAt(0);

    retrievePage(startLetterCode, startPageNumber);
};

exports.getPageSrc = getPageSrc;
exports.parseHtml = parseHtml;
exports.getLookup = getLookup;
exports.parseLookup = parseLookup;
exports.retrieveApp = retrieveApp;
exports.retrieveCategories = retrieveCategories;
exports.retrieveItemSources = retrieveItemSources;


