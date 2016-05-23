'use strict';
var appStoreData = require("../domain/dataProvider/appStoreDataProvider");
var appStoreAdminRepo = require("../repos/appStoreAdminRepo");
var log = require('../logger');

exports.init = function init(app) {

    app.post('/admin/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        appStoreData.retrieveApp(id, function(err, data) {
            if (err) {
                return res.status(500).json({error: err});
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/retrieve_sources', function (req, res) {
        appStoreData.retrieveAllAppSources(function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/lookup_missing_sources', function (req, res) {
        appStoreData.lookupMissingSourceApps(function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/retrieve_app_charts', function (req, res) {
        var batchId = parseInt(req.body.batch, 10);

        if (isNaN(batchId)) {
            return res.status(500).json({"error": 'must specify batch id'});
        }

        appStoreData.retrieveAppCharts(batchId, function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/lookup_missing_chart_apps', function (req, res) {
        appStoreData.lookupMissingChartApps(function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/update_all_apps', function (req, res) {
        var startId = parseInt(req.body.start, 10);

        if (isNaN(startId)) {
            return res.status(500).json({"error": "must specify start id"});
        }

        appStoreData.updateAllAppsBatched(startId, 200, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/refresh_next_app_batch', function (req, res) {
        var batchSize = parseInt(req.body.batchSize, 10);

        if (isNaN(batchSize)) {
            return res.status(500).json({"error": "must specify batch size"});
        }

        appStoreData.refreshNextAppBatches(batchSize, function(err, lastAppId) {
            if (err) {
                return log.error(err);
            }

            log.debug("Successfully refreshed apps batch to last app id: " + lastAppId);
        });

        res.json({status: 'ack'});
    });

    app.post('/admin/appstore/refresh_next_app_source', function (req, res) {
        appStoreData.refreshNextAppSource(function(err, resultTotal) {
            if (err) {
                return log.error(err);
            }

            log.info("Successfully refreshed next app source. New apps: " + resultTotal);
        });

        res.json({status: 'ack'});
    });

    app.post('/admin/appstore/retrieve_new_apps', function (req, res) {
        appStoreData.retrieveNewApps(function(err, newIds) {
            if (err) {
                return log.error(err);
            }

            res.json({time: new Date(), status: 'success', newApps: newIds.length });
        });
    });

    app.post('/admin/appstore/reset_app_popularity', function (req, res, next) {
        appStoreAdminRepo.resetAppPopularities(function(err) {
            if (err) { return next(err); }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/appstore/reset_category_popularity', function (req, res) {
        var batchId = parseInt(req.body.batch, 10);

        if (isNaN(batchId)) {
            return res.status(500).json({"error": "must specify batch id"});
        }

        appStoreAdminRepo.resetCategoryPopularities(batchId, function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.get('/admin/appstore/insert_missing_xyo_categories', function (req, res) {
        appStoreData.insertMissingXyoCategories(function(err, results) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);
        });
    });
};


