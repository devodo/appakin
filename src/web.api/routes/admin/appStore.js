'use strict';
var appStoreData = require("../../domain/dataProvider/appStoreDataProvider");
var appStoreAdminRepo = require("../../repos/appStoreAdminRepo");

exports.init = function init(app) {

    app.post('/admin/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        appStoreData.retrieveApp(id, function(err, data) {
            if (err) {
                return res.status(500).send(err);
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
            return res.status(500).json({"error": "must specify batch id"});
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

    app.post('/admin/appstore/reset_app_popularity', function (req, res) {
        var batchId = parseInt(req.body.batch, 10);

        if (isNaN(batchId)) {
            return res.status(500).json({"error": "must specify batch id"});
        }

        appStoreAdminRepo.resetAppPopularities(batchId, function(err) {
            if (err) {
                return res.status(500).json(err);
            }

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


