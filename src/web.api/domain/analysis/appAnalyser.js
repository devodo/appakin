'use strict';

var async = require('async');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var log = require('../../logger');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();
var crypto = require('crypto');
var XRegExp = require('xregexp').XRegExp;
var natural = require('natural'),
    tokenizer = new natural.WordTokenizer();

var SpellCheck = require('spellcheck'),
    base = __dirname + (process.platform === 'win32' ? '\\' : '/'),
    spell = new SpellCheck(base + 'en_US.aff', base + 'en_US.dic');

//var SimpleCache = require("simple-lru-cache"),
//    tokensLruCache = new SimpleCache({"maxSize":30000});

var invalidTermsRegex = new XRegExp('[\\p{Z}\\p{S}\\p{P}]');
var englishWordRegex = /^[a-z]+$/;

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var setDescIsEnglishStatus = function(appAnalysis) {
    appAnalysis.desc_is_english =
        appAnalysis.desc_english_score >= 0.1 && (
        appAnalysis.desc_english_position === 1 ||
        appAnalysis.desc_english_score >= 0.3 ||
        (appAnalysis.desc_valid_term_count > 0 && (appAnalysis.desc_english_term_count / appAnalysis.desc_valid_term_count) > 0.6) ||
        (appAnalysis.desc_english_term_count > (appAnalysis.desc_valid_term_count * 0.2) && appAnalysis.desc_english_position <= 2));
};

var upsertAppAnalysis = function(appAnalysis, callback) {
    appStoreAdminRepo.upsertAppAnalysis(appAnalysis, function(err) {
        if (err) {
            callback(err);
        } else {
            callback();
        }
    });
};

var getTokenizedMap = function(input) {
    var tokensMap = Object.create(null);

    var tokens = input
        .toLowerCase()
        .split(/\s+|^|\(|\)|\/|"/)
        .filter(function(token) {
            return token.length >= 3 && !invalidTermsRegex.test(token);
        });

    tokens.forEach(function(token) {
        var tokenEntry = tokensMap[token];

        if (!tokenEntry) {
            tokenEntry = { count: 0 };
            tokensMap[token] = tokenEntry;
        }

        tokenEntry.count++;
    });

    return tokensMap;
};

var createHash = function(description, languageCodes) {
    if (!description) {
        return null;
    }

    return crypto
        .createHash('md5')
        .update(description)
        .update(languageCodes ? languageCodes.toString() : '')
        .digest('hex');
};

var processApp = function(app, forceAll, processAppCallback) {
    var i;

    var appAnalysis = {
        app_id: app.app_id,
        desc_length: app.description ? app.description.length : 0,
        name_length: app.name ? app.name.length : 0,
        desc_english_score: 0,
        desc_english_position: 42,
        desc_valid_term_count: 0,
        desc_english_term_count: 0,
        desc_is_english: false,
        desc_md5_checksum: null,
        desc_cleaned: null
    };

    var md5sum = createHash(app.description, app.language_codes);

    if (!forceAll && md5sum && md5sum === app.desc_md5_checksum) {
        // description/language codes have not changed so no processing required.

        processAppCallback();
    } else {
        // Need to analyse the description.

        appAnalysis.desc_md5_checksum = md5sum;

        if (app.language_codes && app.language_codes.length > 0 && app.language_codes.indexOf('EN') === -1) {
            // Assume description is definitely not english if the app publisher says it's not.

            appAnalysis.desc_valid_term_count = -1;
            appAnalysis.desc_english_term_count = -1;

            setDescIsEnglishStatus(appAnalysis);
            upsertAppAnalysis(appAnalysis, processAppCallback);
        } else if (app.description) {
            // There is a description to analyse.

            var languages = lngDetector.detect(app.description);

            for (i = 0; i < languages.length; i++) {
                if (languages[i][0] === 'english') {
                    appAnalysis.desc_english_score = languages[i][1];
                    appAnalysis.desc_english_position = i + 1;

                    break;
                }
            }

            var descIsDefinitelyEnglish = appAnalysis.desc_english_score >= 0.1 &&
                (
                    appAnalysis.desc_english_position === 1 ||
                    appAnalysis.desc_english_score >= 0.3
                );

            var descIsDefinitelyNotEnglish = appAnalysis.desc_english_score < 0.1;

            if (descIsDefinitelyEnglish || descIsDefinitelyNotEnglish) {
                // No need to determine valid term and english terms values.

                appAnalysis.desc_valid_term_count = -1;
                appAnalysis.desc_english_term_count = -1;

                setDescIsEnglishStatus(appAnalysis);
                //cleanDescription(app, appAnalysis);
                upsertAppAnalysis(appAnalysis, processAppCallback);
            } else {
                // Determine valid term and english terms values.

                appAnalysis.desc_valid_term_count = 0;
                appAnalysis.desc_english_term_count = 0;

                var tokenMap = getTokenizedMap(app.description);

                async.each(Object.keys(tokenMap),
                    function (term, termCallback) {
                        if (!term.match(englishWordRegex)) {
                            return termCallback();
                        }

                        var termCount = tokenMap[term].count;
                        appAnalysis.desc_valid_term_count += termCount;

                        //if (tokensLruCache.get(term)) {
                        //    appAnalysis.desc_english_term_count += termCount;
                        //    termCallback();
                        //} else {
                            spell.check(term, function (err, correct) {
                                if (err) {
                                    termCallback(err);
                                }

                                if (correct) {
                                    appAnalysis.desc_english_term_count += termCount;
                                    //tokensLruCache.set(term, true);
                                } else {
                                    //tokensLruCache.set(term, false);
                                }

                                //if (termCount > 1) {
                                //    tokensLruCache.set(term, correct);
                                //}

                                termCallback();
                            });
                        //}
                    },
                    function (err) {
                        if (err) {
                            processAppCallback(err);
                        } else {
                            setDescIsEnglishStatus(appAnalysis);
                            //cleanDescription(app, appAnalysis);
                            upsertAppAnalysis(appAnalysis, processAppCallback);
                        }
                    });
            }
        } else {
            upsertAppAnalysis(appAnalysis, processAppCallback);
        }
    }
};

var analyse = function(batchSize, forceAll, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreAdminRepo.getAppAnalysisBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                //tokensLruCache.reset();
                return next();
            }

            lastId = apps[apps.length - 1].app_id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            async.eachSeries(
                apps,
                function(app, callback) {
                    processApp(app, forceAll, callback);
                },
                function(err) {
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
