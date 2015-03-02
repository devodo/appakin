'use strict';

var appAnalyser = require('../../domain/analysis/appAnalyser');
var log = require('../../logger');

exports.init = function init(app) {

    app.post('/admin/analyse/apps', function (req, res) {
        var batchSize = 100;
        log.debug("Starting analysis of apps");

        var forceAll = req.body.forceAll || false;

        appAnalyser.analyse(batchSize, forceAll, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.get('/admin/app/:appId/normalise', function (req, res) {
        var appId = req.params.appId;
        if (!appId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        appAnalyser.normaliseDescription(appId, function(err, app) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json(app);
        });
    });

    app.get('/admin/app/cleantest', function (req, res) {
        appAnalyser.testCleaningDescriptions(function(err, results) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        })
    })
};
