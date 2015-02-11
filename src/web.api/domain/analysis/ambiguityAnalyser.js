'use strict';

var async = require('async');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var log = require('../../logger');
var appSearcher = require('../search/appSearcher');
var uuidUtil = require('../uuidUtil');

var ignoreTerms = {
    '': true,
    'free': true,
    'ipad': true,
    'iphone': true,
    'app': true,
    'ios': true,
    'edition': true,
    'version': true,
    'preview': true,
    'full': true,
    'plus': true,
    'lite': true,
    'hd': true,
    'xl': true,
    'the': true,
    'and': true,
    'an': true,
    'a': true,
    'by': true,
    'for': true,
    'of': true,
    'with': true,
    'from': true
};

var getAmbiguousDevTerms = function(app, next) {
    var termRegex = /[^a-zA-Z0-9]+/g;

    appSearcher.searchDevAmbiguous(app.name, app.devName, function(err, searchResult) {
        if (err) { return next(err); }

        if (searchResult.total === 0) {
            return next("No ambiguous dev search results for app:" + app.extId);
        } else if (searchResult.total === 1) {
            if (searchResult.apps[0].id !== uuidUtil.stripDashes(app.extId)) {
                return next("Ambiguous dev search did not return source app:" + app.extId);
            }
        }

        var termMap = Object.create(null);
        var ambiguousTermMap = Object.create(null);

        app.name.toLowerCase().split(termRegex).forEach(function(term) {
            termMap[term] = true;
        });

        searchResult.apps.forEach(function(searchApp) {
            if (searchApp.id === uuidUtil.stripDashes(app.extId)) {
                return;
            }

            searchApp.name.toLowerCase().split(termRegex).forEach(function(term) {
                if (!ignoreTerms[term] && !termMap[term]) {
                    ambiguousTermMap[term] = true;
                }
            });
        });

        var ambiguousTerms;

        var keys = Object.keys(ambiguousTermMap);
        if (keys.length > 0) {
            ambiguousTerms = keys;
        }

        next(null, ambiguousTerms);
    });
};

var getTopAmbiguousAppId = function(app, next) {
    var deltaThreshold = 0.1;

    appSearcher.searchGlobalAmbiguous(app.name, app.devName, function(err, searchResult) {
        if (err) { return next(err); }

        if (searchResult.total === 0) {
            return next();
        }

        var topAppId;

        var popularity = parseFloat(app.popularity);
        if (isNaN(popularity)) {
            popularity = 0;
        }

        var topPopularity = parseFloat(searchResult.apps[0].popularity);
        if (isNaN(topPopularity)) {
            topPopularity = 0;
        }

        var popularityDelta = popularity - topPopularity;

        if (isNaN(popularityDelta)) {
            log.warn("Got is not a number for app: " + app.extId);
        }

        if (popularityDelta <= deltaThreshold) {
            topAppId = searchResult.apps[0].id;
        }

        next(null, topAppId);
    });
};

var processApp = function(app, next) {
    var appAmbiguity = {
        appId: app.id,
        isDevAmbiguous: false,
        isGloballyAmbiguous: false,
        topAmbiguousAppExtId: null,
        ambiguousDevTerms: null
    };

    getAmbiguousDevTerms(app, function(err, ambiguousTerms) {
        if (err) {
            appAmbiguity.errorMsg = err;

            return appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
                next(err);
            });
        }

        if (ambiguousTerms && ambiguousTerms.length > 0) {
            appAmbiguity.isDevAmbiguous = true;
            appAmbiguity.ambiguousDevTerms = ambiguousTerms;
        }

        getTopAmbiguousAppId(app, function(err, topAppId) {
            if (err) {
                appAmbiguity.errorMsg = err;

                return appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
                    next(err);
                });
            }

            if (topAppId) {
                appAmbiguity.isGloballyAmbiguous = true;
                appAmbiguity.topAmbiguousAppExtId = topAppId;
            }

            appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
                next(err);
            });
        });
    });
};

var analyse = function(next) {
    var batchSize = 100;

    var batchLoop = function(lastId) {
        appStoreAdminRepo.getMissingAppAmbiguityBatch(lastId, batchSize, function (err, apps) {
            log.debug("Analysing ambiguity batch from: " + lastId);

            if (err) { return next(err); }

            if (apps.length === 0) {
                return next();
            }

            async.eachSeries(apps, processApp, function (err) {
                if (err) { return next(err); }

                batchLoop(apps[apps.length - 1].id);
            });
        });
    };

    batchLoop(0);
};


exports.analyse = analyse;