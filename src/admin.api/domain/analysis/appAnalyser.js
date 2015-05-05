'use strict';

var async = require('async');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var descriptionNormaliser = require('./descriptionNormaliser');
var descriptionProcessors = require('./descriptionProcessors');
var log = require('../../logger');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();
var XRegExp = require('xregexp').XRegExp;

var SpellCheck = require('spellcheck'),
    base = __dirname + (process.platform === 'win32' ? '\\' : '/'),
    spell = new SpellCheck(base + 'en_US.aff', base + 'en_US.dic');

var invalidTermsRegex = new XRegExp('[\\p{Z}\\p{S}\\p{P}]');
var englishWordRegex = /^[a-z]+$/;

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

    var md5sum = app.app_checksum;

    if (!forceAll && md5sum && md5sum === app.desc_md5_checksum) {
        log.debug("Skipping unchanged app: " + app.app_id);
        // description/language codes have not changed so no processing required.
        processAppCallback();
    } else {
        // Need to analyse the description.

        appAnalysis.desc_md5_checksum = md5sum;

        // DN: Ignoring this check because there appear to be a lot of english apps with EN code missing
        if (false && app.language_codes && app.language_codes.length > 0 && app.language_codes.indexOf('EN') === -1) {
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

            var cleanDescriptionCallback = function() {
                if (!appAnalysis.desc_is_english) {
                    upsertAppAnalysis(appAnalysis, processAppCallback);
                } else {
                    cleanDescription(app.app_id, app.name, app.description, app.dev_name, true, function(err, result) {
                        if (err) {
                            processAppCallback(err);
                        }

                        appAnalysis.desc_cleaned = result.string;
                        upsertAppAnalysis(appAnalysis, processAppCallback);
                    });
                }
            };

            if (descIsDefinitelyEnglish || descIsDefinitelyNotEnglish) {
                // No need to determine valid term and english terms values.

                appAnalysis.desc_valid_term_count = -1;
                appAnalysis.desc_english_term_count = -1;

                setDescIsEnglishStatus(appAnalysis);
                cleanDescriptionCallback();
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

                        spell.check(term, function (err, correct) {
                            if (err) {
                                termCallback(err);
                            }

                            if (correct) {
                                appAnalysis.desc_english_term_count += termCount;
                            }

                            termCallback();
                        });
                    },
                    function (err) {
                        if (err) {
                            processAppCallback(err);
                        } else {
                            setDescIsEnglishStatus(appAnalysis);
                            cleanDescriptionCallback();
                        }
                    });
            }
        } else {
            upsertAppAnalysis(appAnalysis, processAppCallback);
        }
    }
};

var analyse = function(batchSize, forceAll, next) {
    log.info('started analysis of apps');

    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreAdminRepo.getAppAnalysisBatch(lastId, batchSize, forceAll, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
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

var normaliseDescription = function(appId, next) {
    appStoreAdminRepo.getAppStoreApp(appId, function(err, app) {
        if (err) {
            return next(err);
        }

        appStoreAdminRepo.getAppStoreSameDeveloperApps(app.id, function(err, sameDeveloperAppNames) {
            if (err) {
                return next(err);
            }

            sameDeveloperAppNames = sameDeveloperAppNames.map(function(x) { return x.name; });

            var normalisedDescription = descriptionNormaliser.createNormalisedDescription(
                app.description,
                app.name,
                app.devName,
                sameDeveloperAppNames
            );

            normalisedDescription.forEachActiveParagraph(function(paragraph) {
                paragraph.forEachSentence(true, function(sentence) {
                    delete sentence.tokens;
                });
            });

            var result = {
                string: normalisedDescription.getResult(),
                html: normalisedDescription.getHtmlResult(),
                tree: normalisedDescription
            };

            return next(null, result);
        });
    });
};

var cleanDescription = function(appId, appName, appDescription, appDevName, onlyStringResult, next) {
    appStoreAdminRepo.getAppStoreSameDeveloperApps(appId, function(err, sameDeveloperAppNames) {
        if (err) {
            return next(err);
        }

        sameDeveloperAppNames = sameDeveloperAppNames.map(function(x) { return x.name; });

        var normalisedDescription = descriptionNormaliser.createNormalisedDescription(
            appDescription,
            appName,
            appDevName,
            sameDeveloperAppNames
        );

        processDescription(normalisedDescription);

        var result = {
            string: normalisedDescription.getResult(),
            html: onlyStringResult ? null : normalisedDescription.getHtmlResult()
        };

        return next(null, result);
    });
};

var testCleaningDescriptions = function(next) {
    appStoreAdminRepo.getAppStoreEnglishAppBatch(0, 1000, function(err, apps) {
        if (err) {
            return next(err);
        }

        var results = {
            count: 0,
            apps: []
        };

        async.eachSeries(
            apps,
            function(app, callback) {
                appStoreAdminRepo.getAppStoreSameDeveloperApps(app.id, function(err, sameDeveloperAppNames) {
                    if (err) {
                        return next(err);
                    }

                    sameDeveloperAppNames = sameDeveloperAppNames.map(function(x) { return x.name; });

                    // TODO exclude app names that are too similar to the current one.
                    var normalisedDescription = descriptionNormaliser.createNormalisedDescription(
                        app.description,
                        app.name,
                        app.devName,
                        sameDeveloperAppNames
                    );

                    processDescription(normalisedDescription);

                    var result = normalisedDescription.getRemovedResult();

                    if (result) {
                        results.apps.push({
                            id: app.id,
                            name: normalisedDescription.appName,
                            normalisedName: normalisedDescription.normalisedAppName,
                            developerName: normalisedDescription.developerName,
                            removed: result,
                            removedHtml: normalisedDescription.getHtmlResult()
                        });

                        ++results.count;
                    }

                    callback();
                });
            },
            function(err) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
    });
};

function processDescription(normalisedDescription) {
    // START
    descriptionProcessors.setStatistics(normalisedDescription);

    // MIDDLE
    descriptionProcessors.removeSentencesWithEmailAddresses(normalisedDescription);
    descriptionProcessors.removeSentencesWithUrls(normalisedDescription);
    descriptionProcessors.removeSentencesWithTwitterNames(normalisedDescription);
    descriptionProcessors.removeCopyrightParagraphs(normalisedDescription);
    descriptionProcessors.removeTermsAndConditionsParagraphs(normalisedDescription);
    descriptionProcessors.removeLongSentences(normalisedDescription);
    descriptionProcessors.removeSentencesWithManyTrademarkSymbols(normalisedDescription);
    descriptionProcessors.removeListsOfAppsBySameDeveloperByMatchingAppNames(normalisedDescription);
    descriptionProcessors.removeLongLists(normalisedDescription);
    descriptionProcessors.removeParagraphsThatStartWithNameOfAppBySameDeveloper(normalisedDescription);
    descriptionProcessors.removeHeadersAndListsForRelatedApps(normalisedDescription);
    descriptionProcessors.removeNoteParagraphs(normalisedDescription);
    descriptionProcessors.removeTechnicalDetailSentences(normalisedDescription);
    descriptionProcessors.removeParagraphsOfRelatedAppsThatAreIndividualSentenceGroups(normalisedDescription);
    descriptionProcessors.removeSentencesOfRelatedApps(normalisedDescription);
    descriptionProcessors.removeByMakersOfSentences(normalisedDescription);
    descriptionProcessors.removeHeaderSentencesBeforeAlreadyRemovedContentAtStartOfParagraph(normalisedDescription);

    // END
    descriptionProcessors.removeListsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved(normalisedDescription);
    descriptionProcessors.removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved(normalisedDescription);
    descriptionProcessors.removeHeaderSentencesBeforeAlreadyRemovedContent(normalisedDescription);
    descriptionProcessors.removeHeaderSentencesBeforeAlreadyRemovedLists(normalisedDescription);
    descriptionProcessors.removeParagraphsInLatterPartOfDescriptionThatHaveRemovedContentAroundThem(normalisedDescription);
}

exports.analyse = analyse;
exports.cleanDescription = cleanDescription;
exports.normaliseDescription = normaliseDescription;
exports.testCleaningDescriptions = testCleaningDescriptions;
