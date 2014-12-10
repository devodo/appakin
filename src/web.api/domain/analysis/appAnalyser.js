'use strict';

var async = require('async');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var log = require('../../logger');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();
var appAnalysisSearcher = require('./appAnalysisSearcher');
var SpellChecker = require('spellchecker'); // TODO: lazy load this
var natural = require('natural'),
    tokenizer = new natural.WordTokenizer();

var getTokenizedMap = function(input) {
    var termsToExclude = /[0-9.@]/;

    var tokensMap = Object.create(null);

    var tokens = tokenizer.tokenize(input.toLowerCase());
    tokens.forEach(function(token) {
        // ignore any term with a digit in it or that is not long enough
        if (token.length < 3 || termsToExclude.test(token)) {
            return;
        }

        var tokenEntry = tokensMap[token];

        if (!tokenEntry) {
            tokenEntry = { count: 0 };
            tokensMap[token] = tokenEntry;
        }

        tokenEntry.count++;
    });

    return tokensMap;
};

var processApp = function(app, callback) {
    var i;

    var appAnalysis = {
        app_id: app.app_id,
        desc_length: app.description ? app.description.length : 0,
        name_length: app.name ? app.name.length : 0,
        desc_english_score: 0,
        desc_english_position: 42,
        desc_valid_term_count: 0,
        desc_english_term_count: 0,
        desc_is_english: false
    };

    if (app.description) {
        var languages = lngDetector.detect(app.description);

        for (i = 0; i < languages.length; i++) {
            if (languages[i][0] === 'english') {
                appAnalysis.desc_english_score = languages[i][1];
                appAnalysis.desc_english_position = i + 1;
                break;
            }
        }

        appAnalysis.desc_valid_term_count = 0;
        appAnalysis.desc_english_term_count = 0;
        var tokenMap = getTokenizedMap(app.description);
        Object.keys(tokenMap).forEach(function(term) {
            var termCount = tokenMap[term].count;
            appAnalysis.desc_valid_term_count += termCount;

            if (!SpellChecker.isMisspelled(term)) {
                appAnalysis.desc_english_term_count += termCount;
            }
        });
    }

    appAnalysis.desc_is_english =
        appAnalysis.desc_english_score >= 0.1 && (
        appAnalysis.desc_english_position === 1 ||
        appAnalysis.desc_english_score >= 0.3 ||
        (appAnalysis.desc_valid_term_count > 0 && (appAnalysis.desc_english_term_count / appAnalysis.desc_valid_term_count) > 0.6) ||
        (appAnalysis.desc_english_term_count > (appAnalysis.desc_valid_term_count * 0.2) && appAnalysis.desc_english_position <= 2)
        );

    appStoreAdminRepo.upsertAppAnalysis(appAnalysis, function(err) {
        if (err) {
            callback(err);
        } else {
            callback();
        }
    });
};

var analyse = function(batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreAdminRepo.getAppAnalysisBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].app_id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            async.eachSeries(apps, processApp, function(err) {
                if (err) {
                    next(err);
                } else {
                    processBatch(lastId);
                }
            });
        });
    };

    processBatch(0);
};

var analyseNew = function(batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreAdminRepo.getAppAnalysisBatchNew(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].app_id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            async.eachSeries(apps, processApp, function(err) {
                if (err) {
                    next(err);
                } else {
                    processBatch(lastId);
                }
            });
        });
    };

    processBatch(0);
};

exports.analyse = analyse;
exports.analyseNew = analyseNew;
