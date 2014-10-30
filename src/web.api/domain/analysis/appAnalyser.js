'use strict';

var async = require('async');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var log = require('../../logger');
var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();

var analyseApp = function(app) {
    var englishDescription = 0;
    var i;

    if (app.description) {
        var languages = lngDetector.detect(app.description);

        for (i = 0; i < languages.length; i++) {
            if (languages[i][0] == 'english') {
                englishDescription = languages[i][1];
                break;
            }
        }
    }

    var analysedApp = {
        app_id: app.app_id,
        english_description: englishDescription,
        description_length: app.description ? app.description.length : 0,
        name_length: app.name ? app.name.length : 0
    };

    return analysedApp;
}

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

            var analysedApps = apps.map(function(app) {
                return analyseApp(app);
            });

            var upsert = function(analysedApp, callback) {
                appStoreAdminRepo.upsertAppAnalysis(analysedApp, function(err) {
                    if (err) {
                        return callback(err);
                    }

                    callback();
                });
            };

            async.eachSeries(analysedApps, upsert, function(err) {
                if (err) {
                    next(err);
                }
            });

            processBatch(lastId);
        });
    };

    processBatch(0);
};

exports.analyse = analyse;
