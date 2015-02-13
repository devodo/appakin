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

// Remove ignore terms from front and back of input string.
// If all terms are ignore terms return original string
var stripIgnoreTerms = function(input) {
    if (!input) {
        return input;
    }

    var terms = input.toLowerCase().split(/[\s:;\-_\/\\\(\)\.]+/g);

    if (terms.length <= 1) {
        return input;
    }

    for (var frontIndex = 0; frontIndex < terms.length; frontIndex++) {
        if (!ignoreTerms[terms[frontIndex]]) {
            break;
        }
    }

    for (var backIndex = terms.length - 1; backIndex >= 0; backIndex--) {
        if (!ignoreTerms[terms[backIndex]]) {
            break;
        }
    }

    if (frontIndex > backIndex) {
        return input;
    }

    var result = terms[frontIndex];
    for (var i = frontIndex + 1; i <= backIndex; i++) {
        result += ' ' + terms[i];
    }

    return result;
};

var getShortName = function(input) {
    var formatRegex = /(.*?)((:\s+|\s+\-|\s+\u2013|\s+\u2014).*)/;
    var matches = formatRegex.exec(input);

    if (!matches) {
        return input;
    }

    return matches[1];
};

var getAmbiguousDevTerms = function(strippedName, app, next) {
    var termRegex = /[^a-zA-Z0-9]+/g;

    appSearcher.searchDevAmbiguous(strippedName, app.devName, function(err, searchResult) {
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

var getTopAmbiguousAppId = function(strippedName, app, next) {
    var deltaThreshold = 0.2;

    appSearcher.searchGlobalAmbiguous(strippedName, app.devName, function(err, searchResult) {
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

var getCanUseShortName = function(app, strippedName, next) {
    var strippedShortName = stripIgnoreTerms(getShortName(app.name));

    if (!strippedShortName || strippedShortName.trim() === '') {
        return next(null, false);
    }

    if (strippedName === strippedShortName) {
        return next(null, false);
    }

    appSearcher.searchGlobalAmbiguous(strippedShortName, null, function(err, searchResult) {
        if (err) { return next(err); }

        if (searchResult.total === 0) {
            return next("No short name search results for app:" + app.extId);
        }

        if (searchResult.total > 1) {
            return next(null, false);
        }

        if (searchResult.apps[0].id !== uuidUtil.stripDashes(app.extId)) {
            return next("Short name search result does not equal source app:" + app.extId);
        }

        return next(null, true);
    });
};

var processApp = function(app, next) {
    var appAmbiguity = {
        appId: app.id,
        isDevAmbiguous: false,
        isGloballyAmbiguous: false,
        canUseShortName: false,
        topAmbiguousAppExtId: null,
        ambiguousDevTerms: null
    };

    var strippedName = stripIgnoreTerms(app.name);

    getAmbiguousDevTerms(strippedName, app, function(err, ambiguousTerms) {
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

        getTopAmbiguousAppId(strippedName, app, function(err, topAppId) {
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

            getCanUseShortName(app, strippedName, function(err, canUseShortName) {
                if (err) {
                    appAmbiguity.errorMsg = err;

                    return appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
                        next(err);
                    });
                }

                appAmbiguity.canUseShortName = canUseShortName;

                appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
                    next(err);
                });
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
exports.stripIgnoreTerms = stripIgnoreTerms;
