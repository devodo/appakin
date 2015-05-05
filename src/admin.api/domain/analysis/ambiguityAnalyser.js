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
    'ipod': true,
    'app': true,
    'ios': true,
    'premium': true,
    'edition': true,
    'version': true,
    'preview': true,
    'trial': true,
    'pro': true,
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

var termRegex = /[^a-zA-Z0-9]+/g;

// Remove ignore terms from front and back of input string.
// If all terms are ignore terms return original string
var stripIgnoreTerms = function(input) {
    if (!input) {
        return input;
    }

    var terms = input.split(/[\s:;\-_\/\\\(\)\.]+/g);

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

var getShortAnalysis = function(input) {
    var formatRegex = /(.*?)(:\s+|\s+\-|\s+\u2013|\s+\u2014)(.*)/;
    var matches = formatRegex.exec(input);

    if (!matches) {
        return null;
    }

    if (matches[1].trim() === '') {
        return null;
    }

    return {
        shortName: matches[1],
        remainder: matches[3]
    };
};

var getStrippedAnalysis = function(input) {
    if (!input) {
        return input;
    }

    var inputLower = input.toLowerCase();
    var strippedName = stripIgnoreTerms(inputLower);
    var shortAnalysis = getShortAnalysis(inputLower);
    var strippedShortName = shortAnalysis ? stripIgnoreTerms(shortAnalysis.shortName) : null;

    return {
        strippedName: strippedName,
        strippedShortName: strippedShortName,
        shortAnalysis: shortAnalysis
    };
};

var getAmbiguousDevTerms = function(strippedAnalysis, app, next) {
    appSearcher.searchDevAmbiguous(strippedAnalysis.strippedName, app.devName, function(err, searchResult) {
        if (err) { return next(err); }

        var appExtId = uuidUtil.stripDashes(app.extId);

        if (searchResult.total === 0) {
            return next("No ambiguous dev search results for app:" + app.extId);
        } else if (searchResult.total === 1) {
            if (searchResult.apps[0].id !== appExtId) {
                return next("Ambiguous dev search did not return source app:" + app.extId);
            }
        }

        var termMap = Object.create(null);
        var ambiguousTermMap = Object.create(null);

        app.name.toLowerCase().split(termRegex).forEach(function(term) {
            termMap[term] = true;
        });

        searchResult.apps.forEach(function(searchApp) {
            if (searchApp.id === appExtId) {
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

var getTopAmbiguousAppId = function(strippedAnalysis, app, next) {
    var deltaThreshold = 0.2;

    appSearcher.searchGlobalAmbiguous(strippedAnalysis.strippedName, app.devName, function(err, searchResult) {
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

var getGlobalCanUseShortName = function(app, strippedAnalysis, next) {
    appSearcher.searchGlobalAmbiguous(strippedAnalysis.strippedShortName, null, function(err, searchResult) {
        if (err) { return next(err); }

        if (searchResult.total === 0) {
            return next("No short name search results for app:" + app.extId);
        }

        if (searchResult.total > 1) {
            return next(null, false, searchResult.total);
        }

        if (searchResult.apps[0].id !== uuidUtil.stripDashes(app.extId)) {
            return next("Short name search result does not equal source app:" + app.extId);
        }

        return next(null, true, searchResult.total);
    });
};

var getDevShortNameAmbiguousTerms = function(app, strippedAnalysis, globalTotal, next) {
    appSearcher.searchDevAmbiguous(strippedAnalysis.strippedShortName, app.devName, function(err, searchResult) {
        if (err) { return next(err); }

        var appExtId = uuidUtil.stripDashes(app.extId);

        if (searchResult.total === 0) {
            return next("No short name dev search results for app:" + app.extId);
        } else if (searchResult.total === 1) {
            if (searchResult.apps[0].id !== appExtId) {
                return next("Dev short name search did not return source app:" + app.extId);
            }
        }

        // If the totals are not equal there are matches external to the dev apps
        if (searchResult.total !== globalTotal) {
            return next(null, false);
        }

        var termMap = Object.create(null);
        var ambiguousTermMap = Object.create(null);

        strippedAnalysis.shortAnalysis.shortName.split(termRegex).forEach(function(term) {
            termMap[term] = true;
        });

        var addAmbiguousTerm = function(term) {
            if (!ignoreTerms[term] && !termMap[term]) {
                ambiguousTermMap[term] = true;
            }
        };

        for (var i = 0; i < searchResult.apps.length; i++) {
            var searchApp = searchResult.apps[i];
            if (searchApp.id === appExtId) {
                continue;
            }

            var searchAppLower = searchApp.name.toLowerCase();
            var shortAnalysis = getShortAnalysis(searchAppLower);

            if (!shortAnalysis) {
                return next(null, false);
            }

            if (shortAnalysis.remainder !== strippedAnalysis.shortAnalysis.remainder) {
                return next(null, false);
            }

            shortAnalysis.shortName.split(termRegex).forEach(addAmbiguousTerm);
        }

        var ambiguousTerms;

        var keys = Object.keys(ambiguousTermMap);
        if (keys.length > 0) {
            ambiguousTerms = keys;
        }

        next(null, true, ambiguousTerms);
    });
};

var analyseShortName = function(app, strippedAnalysis, next) {
    if (!strippedAnalysis.strippedShortName) {
        return next(null, false);
    }

    getGlobalCanUseShortName(app, strippedAnalysis, function(err, canUse, total) {
        if (err) { return next(err); }

        if (canUse === true) {
            return next(null, true);
        }

        getDevShortNameAmbiguousTerms(app, strippedAnalysis, total, function(err, canUse, terms) {
            if (err) { return next(err); }

            if (canUse === true) {
                return next(null, true, terms);
            }

            return next(null, false);
        });
    });
};

var analyseAmbiguity = function(app, next) {
    var appAmbiguity = {
        appId: app.id,
        isDevAmbiguous: false,
        isGloballyAmbiguous: false,
        canUseShortName: false,
        topAmbiguousAppExtId: null,
        ambiguousDevTerms: null
    };

    var strippedAnalysis = getStrippedAnalysis(app.name);

    analyseShortName(app, strippedAnalysis, function(err, canUseShortName, ambiguousDevTerms) {
        if (err) {
            appAmbiguity.errorMsg = err;
            return next(null, appAmbiguity);
        }

        if (canUseShortName === true) {
            appAmbiguity.canUseShortName = true;
            appAmbiguity.ambiguousDevTerms = ambiguousDevTerms;
            return next(null, appAmbiguity);
        }

        getAmbiguousDevTerms(strippedAnalysis, app, function(err, ambiguousTerms) {
            if (err) {
                appAmbiguity.errorMsg = err;
                return next(null, appAmbiguity);
            }

            if (ambiguousTerms && ambiguousTerms.length > 0) {
                appAmbiguity.isDevAmbiguous = true;
                appAmbiguity.ambiguousDevTerms = ambiguousTerms;
            }

            getTopAmbiguousAppId(strippedAnalysis, app, function(err, topAppId) {
                if (err) {
                    appAmbiguity.errorMsg = err;
                    return next(null, appAmbiguity);
                }

                if (topAppId) {
                    appAmbiguity.isGloballyAmbiguous = true;
                    appAmbiguity.topAmbiguousAppExtId = topAppId;
                }

                return next(null, appAmbiguity);
            });
        });
    });
};

var processApp = function(app, next) {
    analyseAmbiguity(app, function(err, appAmbiguity) {
        if (err) { return next(err); }

        appStoreAdminRepo.insertAppAmbiguity(appAmbiguity, function(err) {
            next(err);
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
exports.getStrippedAnalysis = getStrippedAnalysis;
