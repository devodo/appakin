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

    app.post('/admin/task/rebuild_category_apps', function (req, res, next) {
        log.info("Starting rebuild category apps batch task");
        var start = process.hrtime();
        batchTask.reloadCategoryApps(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild category apps batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild category apps task started" });
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

        res.json({ "status": "Rebuild reset app popularity task started" });
    });
};

