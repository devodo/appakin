'use strict';
var cheerio = require('cheerio');
var async = require('async');
var request = require('request');
var log = require('../../logger');
var appStoreAdminRepo = require("../../repos/appStoreAdminRepo");
var auditRepo = require("../../repos/auditRepo");
var connection = require("../../repos/connection");
var S = require('string');

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
    var maxLookupSize = 200;
    var results = [];

    var processBatch = function(idIndex) {
        if (idIndex >= ids.length) {
            return next(null, results);
        }

        var batchIds = [];
        for (var i = idIndex; i < ids.length && i < idIndex + maxLookupSize; i++) {
            batchIds.push(ids[i]);
        }

        var url = 'https://itunes.apple.com/lookup?id=' + batchIds.join();

        log.debug("Issuing iTunes apps lookup. Id count: " + batchIds.length);
        request(url, function (err, response, src) {
            if (err) { return next(err); }

            try {
                var jsonData = JSON.parse(src);
                log.debug("Received iTunes apps lookup response. Apps count: " + jsonData.results.length);

                jsonData.results.forEach(function(result) {
                    results.push(result);
                });

                processBatch(idIndex + batchIds.length);
            } catch (ex) {
                return next(ex);
            }
        });
    };

    processBatch(0);
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

            appStoreAdminRepo.insertAppStoreApp(app, function(err, itemId) {
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

                appStoreAdminRepo.insertAppStoreApp(app, function(err, appId) {
                    if (err) {
                        return callback(err);
                    }

                    callback();
                });
            });
        }, next);
    });
};

var updateApps = function(ids, next) {
    getLookups(ids, function(err, results) {
        if (err) {
            return next(err);
        }

        async.eachSeries(results, function(result, callback) {
            parseLookup(result, function(err, app) {
                if (err) {
                    return next(err);
                }

                appStoreAdminRepo.updateAppStoreApp(app, function(err) {
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
        var $ = cheerio.load(src);
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
                appStoreAdminRepo.insertAppStoreCategory(category, function(err, id) {
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

    var appSources = [];

    $('#selectedcontent a').map(function(i, el) {
        var url = $(this).attr('href');
        var name = $(this).text();
        var match = idRegex.exec(url);
        var id = match[1];

        var appSrc = {
            storeAppId: id,
            name: name
        };

        appSources.push(appSrc);
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
                appStoreAdminRepo.insertAppStoreAppSrc(appSource, category.id, letter, pageNumber, function(err, id) {
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

var retrieveAppChartSources = function(category, batchId, next) {
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

            appStoreAdminRepo.insertAppChartEntry(appSource, category.id, position, batchId, function(err, id) {
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

var retrieveAppCharts = function(batchId, next) {
    appStoreAdminRepo.getAppStoreCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        async.eachSeries(categories, function(category, callback) {
            retrieveAppChartSources(category, batchId, function(err, results) {
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
    appStoreAdminRepo.getAppStoreCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        async.eachSeries(categories, function(category, callback) {
            retrieveAppSources(category, 'A', 1, callback);
        }, next);
    });
};

var lookupSourceAppsBatched = function(startId, batchSize, next) {
    appStoreAdminRepo.getAppStoreSourceItemBatch(startId, batchSize, function(err, results) {
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

var processUpdateAppsBatch = function(fromId, batchSize, next) {
    log.debug("Batch lookup start id: " + fromId);

    appStoreAdminRepo.getAppStoreIdBatch(fromId, batchSize, function(err, results) {
        if (err) { return next(err); }

        if (results.length === 0) {
            return next();
        }

        var lastId = results[results.length - 1].id;

        var appIds = results.map(function(appSource) {
            return appSource.storeAppId;
        });

        updateApps(appIds, function(err) {
            if (err) { return next(err); }

            next(null, lastId);
        });
    });
};

var updateAllAppsBatched = function(startId, batchSize, next) {
    var processLoop = function(lastId) {
        processUpdateAppsBatch(lastId, batchSize, function(err, newLastId) {
            if (err) { return next(err); }

            if (!newLastId) {
                return next();
            }

            processLoop(newLastId);
        });
    };

    processLoop(startId);
};

var getNextSourceIndex = function(audit) {
    var LAST_CATEGORY_ID = 69;
    var letter = 'A';
    var categoryId = 1;

    if (audit) {
        categoryId = audit.appstoreCategoryId;
        var letterCode = audit.letter.charCodeAt(0);

        if (letterCode >= 65 && letterCode < 90) {
            letter = String.fromCharCode(letterCode + 1);
        } else if (letterCode === 90) {
            letter = '*';
        }
        else {
            letter = 'A';
            categoryId++;

            if (categoryId > LAST_CATEGORY_ID) {
                categoryId = 1;
            }
        }
    }

    return {
        letter: letter,
        categoryId: categoryId
    };
};

var retrieveAppSources = function(category, letter, next) {
    var prevAppSources = [];
    var results = [];

    var retrievePage = function(pageNumber) {
        log.debug("Retrieving app sources for category: " + category.id + " letter: " + letter + " page: " + pageNumber);

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
                    return next(null, results);
                }
            }

            prevAppSources = appSources;
            appSources.forEach(function(appSource) {
                results.push(appSource);
            });

            retrievePage(pageNumber + 1);
        };

        var url = category.storeUrl + '&letter=' + letter + '&page=' + pageNumber;

        request(url, callback);
    };

    retrievePage(1);
};

var refreshNextAppSource = function(next) {
    log.debug("Refreshing next apps source");

    auditRepo.getLastAppStoreSourceRefresh(function(err, audit) {
        if (err) { return next(err); }

        var nextSource = getNextSourceIndex(audit);

        var handleError = function(err) {
            var errorAudit = {
                appstoreCategoryId: nextSource.categoryId,
                letter: nextSource.letter,
                isSuccess: false,
                errorMessage: JSON.stringify(err)
            };

            auditRepo.auditAppStoreSourceRefresh(errorAudit, function(auditErr) {
                next(auditErr ? auditErr : err);
            });
        };

        appStoreAdminRepo.getAppStoreCategory(nextSource.categoryId, function(err, category) {
            if (err) { return handleError(err); }

            retrieveAppSources(category, nextSource.letter, function(err, appSources) {
                if (err) { return handleError(err); }

                var appIds = appSources.map(function(appSource) {
                    return appSource.storeAppId;
                });

                appStoreAdminRepo.getExistingAppStoreIds(appIds, function(err, ids) {
                    if (err) { return handleError(err); }

                    var existingIdsMap = Object.create(null);
                    ids.forEach(function(id) {
                        existingIdsMap[id] = true;
                    });

                    var newAppIds = appIds.filter(function(appId) {
                        return !existingIdsMap[appId];
                    });

                    insertNewApps(newAppIds, function(err) {
                        if (err) { return handleError(err); }

                        var successAudit = {
                            appstoreCategoryId: category.id,
                            letter: nextSource.letter,
                            newApps: newAppIds.length,
                            isSuccess: true
                        };

                        auditRepo.auditAppStoreSourceRefresh(successAudit, function(err) {
                            if (err) { return next(err); }

                            next(null, newAppIds.length);
                        });
                    });
                });
            });
        });

    });
};

var refreshNextAppBatches = function(batchSize, next) {
    log.debug("Refreshing next apps batch of size: " + batchSize);

    auditRepo.getLastAppStoreRefresh(function(err, audit) {
        if (err) { return next(err); }

        var lastAppId = audit ? audit.lastAppId : 0;
        log.debug("Last valid app id found: " + lastAppId);

        var updateApps = function(callback) {
            processUpdateAppsBatch(lastAppId, batchSize, function(err, lastId) {
                if (err) { return callback(err); }

                if (lastId) {
                    return callback(null, lastId);
                }

                // We've reached the last app so loop round and start again
                processUpdateAppsBatch(0, batchSize, function(err, lastId) {
                    if (err) { return callback(err); }

                    callback(null, lastId);
                });
            });
        };

        updateApps(function(updateError, lastId) {
            var audit = null;
            if (updateError) {
                audit = {
                    lastAppId: lastAppId,
                    isSuccess: false,
                    errorMessage: JSON.stringify(updateError)
                };
            } else {
                audit = {
                    lastAppId: lastId,
                    isSuccess: true
                };
            }

            auditRepo.auditAppStoreRefresh(audit, function(auditError) {
                var err = auditError ? auditError : updateError;
                next(err, lastId);
            });
        });
    });
};

var retrieveMissingApps = function(appIds, next) {
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

var lookupMissingChartApps = function(next) {
    appStoreAdminRepo.getMissingChartAppIds(function(err, appIds) {
        log.debug("Found " + appIds.length + " missing chart apps");

        if (err) {
            return next(err);
        }

        retrieveMissingApps(appIds, next);
    });
};

var lookupMissingSourceApps = function(next) {
    appStoreAdminRepo.getMissingAppStoreSourceApps(function(err, results) {
        log.debug("Found " + results.length + " missing source apps");

        if (err) {
            return next(err);
        }

        var appIds = results.map(function(appSource) {
            return appSource.storeAppId;
        });

        retrieveMissingApps(appIds, next);
    });
};

var getCategories = function(next) {
    appStoreAdminRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        next(null, categories);
    });
};

var insertMissingXyoCategories = function(next) {
    var results = [];

    connection.open(function(err, conn) {
        if (err) { return next(err); }

        var closeFinally = function(err) {
            conn.close(err, function(err) {
                next(err, results);
            });
        };

        conn.beginTran(function(err) {
            if (err) { return closeFinally(err); }

            appStoreAdminRepo.getMissingXyoCategories(conn.client, function(err, xyoCategories) {
                if (err) { return closeFinally(err); }

                var processCategory = function(xyoCategory, callback) {
                    var nameWords = xyoCategory.name.toLowerCase().split(/\s/);

                    if (nameWords.length > 1 && nameWords[0] === nameWords[nameWords.length - 1]) {
                        nameWords.pop();
                    }

                    if (nameWords.length > 1 && nameWords[nameWords.length - 1] === 'apps') {
                        nameWords.pop();
                    }

                    var pos = 0;
                    var name = nameWords.map(function(word) {
                        if (pos > 0 && /^(and|but|nor|or|of|the|a|an|at|by|with|for|in|on|to)$/i.test(word)) {
                            return word.toLowerCase();
                        }

                        pos = pos + 1;

                        return S(word).capitalize();
                    }).join(' ');

                    appStoreAdminRepo.insertCategory(conn.client, name, xyoCategory.description, function(err, catId) {
                        if (err) { return callback(err); }

                        appStoreAdminRepo.insertXyoCategoryMap(conn.client, catId, xyoCategory.id, function(err) {
                            if (err) { return callback(err); }

                            results.push(name);
                            callback();
                        });
                    });
                };

                async.eachSeries(xyoCategories, processCategory, function(err) {
                    if (err) { return closeFinally(err); }

                    conn.commitTran(function(err) {
                        closeFinally(err);
                    });
                });
            });
        });
    });
};

var lookupNewAppStoreIds = function(next) {
    var feedUrl = "https://itunes.apple.com/us/rss/newapplications/limit=100/json";

    log.debug("Issuing new apps rss feed lookup");
    request(feedUrl, function (err, response, src) {
        if (err) { return next(err); }

        try {
            var jsonData = JSON.parse(src);

            var ids = jsonData.feed.entry.map(function(entry) {
                return entry.id.attributes["im:id"];
            });

            return next(null, ids);
        } catch (ex) {
            return next(ex);
        }
    });
};

var insertNewApps = function(ids, next) {
    appStoreAdminRepo.getExistingAppStoreIds(ids, function(err, existingIds) {
        if (err) { return next(err); }

        var existingIdsMap = Object.create(null);
        existingIds.forEach(function(id) {
            existingIdsMap[id] = true;
        });

        var newIds = ids.filter(function(id) {
            return !existingIdsMap[id];
        });

        retrieveApps(newIds, function(err) {
            if (err) { return next(err); }

            return next(null, newIds);
        });
    });
};

var retrieveNewApps = function(next) {
    lookupNewAppStoreIds(function(err, ids) {
        if (err) { return next(err); }

        insertNewApps(ids, function(err) {
            next(err);
        });
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
exports.lookupSourceAppsBatched = lookupSourceAppsBatched;
exports.updateAllAppsBatched = updateAllAppsBatched;
exports.refreshNextAppBatches = refreshNextAppBatches;
exports.refreshNextAppSource = refreshNextAppSource;
exports.retrieveAppCharts = retrieveAppCharts;
exports.lookupMissingChartApps = lookupMissingChartApps;
exports.lookupMissingSourceApps = lookupMissingSourceApps;
exports.getCategories = getCategories;
exports.insertMissingXyoCategories = insertMissingXyoCategories;

exports.lookupNewAppStoreIds = lookupNewAppStoreIds;
exports.retrieveNewApps = retrieveNewApps;


