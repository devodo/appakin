'use strict';

var prettyHrtime = require('pretty-hrtime');
var log = require('../logger');
var batchTask = require('../domain/admin/batchTask');

exports.init = function init(app) {
    app.post('/admin/task/rebuild_all', function (req, res, next) {
        log.info("Starting rebuild all batch task");
        var start = process.hrtime();
        batchTask.rebuildAll(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild all batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild all task started" });
    });

    app.post('/admin/task/rebuild_seed_categories', function (req, res, next) {
        log.info("Starting rebuild seed categories batch task");
        var start = process.hrtime();
        batchTask.rebuildAllSeedCategories(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild seed categories batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild seed categories task started" });
    });

    app.post('/admin/task/rebuild_seed_category', function (req, res, next) {
        var seedCategoryId = req.body.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        log.info("Starting rebuild of seed category: " + seedCategoryId);

        var start = process.hrtime();
        batchTask.rebuildSeedCategory(seedCategoryId, function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild of seed category: " + seedCategoryId + " in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild seed categories task started" });
    });

    app.post('/admin/task/rebuild_cluster_index', function (req, res, next) {
        log.info("Starting rebuild cluster index batch task");
        var start = process.hrtime();
        batchTask.rebuildClusterIndex(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild cluster index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild cluster index task started" });
    });

    app.post('/admin/task/cluster_index_changed_apps', function (req, res, next) {
        log.info("Starting cluster index changed apps batch task");

        var modifiedSinceDate = new Date(Date.parse(req.body.fromDate));

        var start = process.hrtime();
        batchTask.clusterIndexChangedApps(modifiedSinceDate, function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed cluster index changed apps batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Cluster index changed apps task started" });
    });

    app.post('/admin/task/reset_app_popularity', function (req, res, next) {
        log.info("Starting reset app popularity batch task");
        var start = process.hrtime();
        batchTask.resetAppPopularity(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed reset app popularity batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset app popularity task started" });
    });

    app.post('/admin/task/reset_app_ranking', function (req, res, next) {
        log.info("Starting reset app ranking batch task");
        var start = process.hrtime();
        batchTask.resetAppRanking(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed reset app ranking batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset app ranking task started" });
    });

    app.post('/admin/task/reset_category_popularity', function (req, res, next) {
        log.info("Starting reset category popularity batch task");
        var start = process.hrtime();
        batchTask.resetCategoryPopularity(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed reset category popularity batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset category popularity task started" });
    });

    app.post('/admin/task/reset_category_genres', function (req, res, next) {
        log.info("Starting reset category genres batch task");
        var start = process.hrtime();
        batchTask.resetCategoryGenres(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed reset category genres batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset category genres task started" });
    });

    app.post('/admin/task/reset_related_categories', function (req, res, next) {
        log.info("Starting reset related categories batch task");
        var start = process.hrtime();
        batchTask.resetRelatedCategories(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed reset related categories batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset related categories task started" });
    });

    app.post('/admin/task/analyse_ambiguity', function (req, res, next) {
        log.info("Starting analyse ambiguity batch task");
        var start = process.hrtime();
        batchTask.analyseAmbiguity(function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed analyse ambiguity batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Analyse ambiguity task started" });
    });
};

