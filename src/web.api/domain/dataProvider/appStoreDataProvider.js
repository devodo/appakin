'use strict';
var cheerio = require('cheerio');
var async = require('async');
var request = require('request');
var log = require('../../logger');
var appStoreRepo = require("../../repos/appakin/appStoreRepo");

var getPageSrc = function(id, next) {
    var url = 'https://itunes.apple.com/us/app/id' + id;

    request(url, function (err, response, src) {
        if (err) {
            return next(err);
        }

        next(null, src);
    });
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
    var url = 'https://itunes.apple.com/lookup?id=' + id;

    request(url, function (err, response, src) {
        if (err) {
            return next(err);
        }

        try {
            var result = JSON.parse(src);

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
    });
};

var getLookups = function(ids, next) {
    var url = 'https://itunes.apple.com/lookup?id=' + ids.join();

    request(url, function (err, response, src) {
        if (err) {
            return next(err);
        }

        try {
            var jsonData = JSON.parse(src);

            next(null, jsonData.results);
        } catch (ex) {
            return next(ex);
        }
    });
};

var parseLookup = function(data, next) {
    if (data.kind !== "software") {
        return next("iTunes item is not an app");
    }

    var result = {
        name: data.trackName,
        storeAppId: data.trackId,
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
        price: Math.round(data.price * 100),
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

            appStoreRepo.insertAppStoreApp(app, function(err, itemId) {
                if (err) {
                    return next(err);
                }

                next(null, itemId);
            });
        });
    });
};

var retrieveApps = function(ids, next) {
    getLookups(ids, function(err, results) {
        if (err) {
            return next(err);
        }

        async.eachSeries(results, function(result, callback) {
            parseLookup(result, function(err, app) {
                if (err) {
                    return next(err);
                }

                appStoreRepo.insertAppStoreApp(app, function(err, appId) {
                    if (err) {
                        return callback(err);
                    }

                    callback();
                });
            });
        }, next);
    });
};

var retrieveCategories = function(next) {
    var url = 'https://itunes.apple.com/us/genre/ios/id36?mt=8';

    request(url, function (err, response, src) {
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
                appStoreRepo.insertAppStoreCategory(category, function(err, id) {
                    callback(err, id);
                });
            };
        });

        async.series(tasks, function(err, results) {
            next(err, results);
        });
    });
};

var parseAppSources = function(pageSrc) {
    var idRegex = /id([\d]+)/;

    var $ = cheerio.load(pageSrc);

    var appSources = $('#selectedcontent a').map(function(i, el) {
        var url = $(this).attr('href');
        var name = $(this).text();
        var match = idRegex.exec(url);
        var id = match[1];

        var appSrc = {
            storeAppId: id,
            name: name
        };

        return appSrc;
    });

    return appSources;
};

var retrieveAppSources = function(category, startLetter, startPageNumber, next) {
    log.debug("Retrieve app sources for category: " + category.name);
    var prevAppSources = [];

    var retrievePage = function(letterCode, pageNumber) {
        var letter = String.fromCharCode(letterCode);
        log.debug(letter + " " + pageNumber);

        var callback = function(err, response, pageSrc) {
            if (err) {
                return next(err);
            }

            var appSources = parseAppSources(pageSrc);

            if (appSources.length === prevAppSources.length) {
                var isSame = true;
                for (var i = 0; i < appSources.length; i++) {
                    if (appSources[i].storeAppId !== prevAppSources[i].storeAppId) {
                        isSame = false;
                        break;
                    }
                }

                if (isSame) {
                    appSources = [];
                }
            }

            prevAppSources = appSources;

            var results = [];

            var processAppSource = function(appSource, callback) {
                appStoreRepo.insertAppStoreAppSrc(appSource, category.id, letter, pageNumber, function(err, id) {
                    if (err) {
                        return callback(err);
                    }

                    results.push(id);
                    callback();
                });
            };

            async.eachSeries(appSources, processAppSource, function(err) {
                if (err) {
                    return next(err);
                }

                if (results.length > 0) {
                    return retrievePage(letterCode, pageNumber+1);
                }

                if (letterCode >= 65 && letterCode < 90) {
                    return retrievePage(letterCode+1, 1);
                }

                if (letterCode === 90) {
                    return retrievePage(42, 1);
                }

                next();
            });
        };

        var url = category.storeUrl + '&letter=' + letter + '&page=' + pageNumber;

        request(url, callback);
    };

    var startLetterCode = startLetter.charCodeAt(0);

    retrievePage(startLetterCode, startPageNumber);
};

var retrievePopularAppSources = function(category, batchId, next) {
    request(category.storeUrl, function (err, response, src) {
        if (err) {
            return next(err);
        }

        var appSources = parseAppSources(src);

        var position = 0;
        var results = [];
        var previousCheck = {};

        var processAppSource = function(appSource, callback) {
            position = position + 1;

            if (previousCheck[appSource.storeAppId]) {
                log.warn("Duplicate popular app detected for app id: " + appSource.storeAppId);
                return callback();
            }

            previousCheck[appSource.storeAppId] = true;

            appStoreRepo.insertAppStorePopular(appSource, category.id, position, batchId, function(err, id) {
                if (err) {
                    return callback(err);
                }

                results.push(id);
                callback();
            });
        };

        async.eachSeries(appSources, processAppSource, function(err) {
            if (err) {
                return next(err);
            }

            next(null, results);

        });
    });
};

var retrievePopularAppSourcesBatch = function(batchId, next) {
    appStoreRepo.getAppStoreCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        async.eachSeries(categories, function(category, callback) {
            retrievePopularAppSources(category, batchId, function(err, results) {
                if (err) {
                    return callback(err);
                }

                if (results.length === 0) {
                    return callback("No results returned for category: " + category.id);
                }

                callback();
            });
        }, next);
    });
};

var retrieveAllAppSources = function(next) {
    appStoreRepo.getAppStoreCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        async.eachSeries(categories, function(category, callback) {
            retrieveAppSources(category, 'A', 1, callback);
        }, next);
    });
};

var lookupAppsBatched = function(startId, batchSize, next) {
    appStoreRepo.getAppStoreSourceItemBatch(startId, batchSize, function(err, results) {
        log.debug("Batch lookup start id: " + startId);

        if (err) {
            return next(err);
        }

        if (results.length === 0) {
            return next();
        }

        var lastId = results[results.length - 1].id;

        var appIds = results.map(function(appSource) {
            return appSource.storeAppId;
        });

        retrieveApps(appIds, function(err) {
            if (err) {
                return next(err);
            }

            return next(null, lastId);
        });
    });
};

var retrieveMissingApp = function(apps, next) {
    var appIds = apps.map(function(appSource) {
        return appSource.storeAppId;
    });

    var processBatch = function() {
        var batch = [];
        var maxItunesBatchSize = 200;

        while (batch.length < maxItunesBatchSize && appIds.length > 0) {
            batch.push(appIds.shift());
        }

        if (batch.length === 0) {
            return next();
        }

        retrieveApps(batch, function(err) {
            if (err) {
                return next(err);
            }

            processBatch();
        });
    };

    processBatch();
};

var lookupMissingPopularApps = function(next) {
    appStoreRepo.getMissingAppStorePopularApps(function(err, results) {
        log.debug("Found " + results.length + " missing popular apps");

        if (err) {
            return next(err);
        }

        retrieveMissingApp(results, next);
    });
};

var lookupMissingSourceApps = function(next) {
    appStoreRepo.getMissingAppStoreSourceApps(function(err, results) {
        log.debug("Found " + results.length + " missing source apps");

        if (err) {
            return next(err);
        }

        retrieveMissingApp(results, next);
    });
};

var getCategories = function(next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        next(null, categories);
    });
};

exports.getPageSrc = getPageSrc;
exports.parseHtml = parseHtml;
exports.getLookup = getLookup;
exports.parseLookup = parseLookup;
exports.retrieveApp = retrieveApp;
exports.retrieveCategories = retrieveCategories;
exports.retrieveAppSources = retrieveAppSources;
exports.retrieveAllAppSources = retrieveAllAppSources;
exports.lookupAppsBatched = lookupAppsBatched;
exports.retrievePopularAppSourcesBatch = retrievePopularAppSourcesBatch;
exports.lookupMissingPopularApps = lookupMissingPopularApps;
exports.lookupMissingSourceApps = lookupMissingSourceApps;
exports.getCategories = getCategories;


