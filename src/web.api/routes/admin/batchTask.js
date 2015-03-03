'use strict';

var prettyHrtime = require('pretty-hrtime');
var log = require('../../logger');
var batchTask = require('../../domain/admin/batchTask');

exports.init = function init(app) {
    app.post('/admin/task/rebuild_all', function (req, res, next) {
        log.info("Starting rebuild all batch task");
        var start = process.hrtime();
        batchTask.rebuildAll(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild all batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild all task started" });
    });

    app.post('/admin/task/rebuild_seed_categories', function (req, res, next) {
        log.info("Starting rebuild seed categories batch task");
        var start = process.hrtime();
        batchTask.rebuildAllSeedCategories(function(err) {
            if (err) { return next(err); }

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
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild of seed category: " + seedCategoryId + " in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild seed categories task started" });
    });

    app.post('/admin/task/rebuild_cluster_index', function (req, res, next) {
        log.info("Starting rebuild cluster index batch task");
        var start = process.hrtime();
        batchTask.rebuildClusterIndex(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild cluster index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild cluster index task started" });
    });

    app.post('/admin/task/rebuild_auto_index', function (req, res, next) {
        log.info("Starting rebuild auto index batch task");
        var start = process.hrtime();
        batchTask.rebuildAutoIndex(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild auto index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild auto index task started" });
    });

    app.post('/admin/task/rebuild_app_index', function (req, res, next) {
        log.info("Starting rebuild app index batch task");
        var start = process.hrtime();
        batchTask.rebuildAppIndex(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild app index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild app index task started" });
    });

    app.post('/admin/task/rebuild_category_index', function (req, res, next) {
        log.info("Starting rebuild category index batch task");
        var start = process.hrtime();
        batchTask.rebuildCategoryIndex(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild category index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild category index task started" });
    });

    app.post('/admin/task/reset_app_popularity', function (req, res, next) {
        log.info("Starting reset app popularity batch task");
        var start = process.hrtime();
        batchTask.resetAppPopularity(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed reset app popularity batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset app popularity task started" });
    });

    app.post('/admin/task/reset_related_categories', function (req, res, next) {
        log.info("Starting reset related categories batch task");
        var start = process.hrtime();
        batchTask.resetRelatedCategories(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed reset related categories batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Reset related categories task started" });
    });

    app.post('/admin/task/analyse_ambiguity', function (req, res, next) {
        log.info("Starting analyse ambiguity batch task");
        var start = process.hrtime();
        batchTask.analyseAmbiguity(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed analyse ambiguity batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Analyse ambiguity task started" });
    });
};

