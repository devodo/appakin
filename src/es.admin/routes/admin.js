'use strict';

var prettyHrtime = require('pretty-hrtime');
var appIndexer = require('../elasticsearch/appIndexer');
var appSnapshot = require('../elasticsearch/appSnapshot');
var appRestore = require('../elasticsearch/appRestore');
var log = require('../logger');

exports.init = function init(app) {
    app.post('/index/app/rebuild', function (req, res) {
        var batchSize = req.body.batchSize;
        if (!batchSize || isNaN(batchSize)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        log.info("Starting rebuild app index batch task");
        var start = process.hrtime();
        appIndexer.rebuildAndSwapInPromise(batchSize)
            .then(function (newIndexName) {
                log.info("App index successfully rebuilt: " + newIndexName);

                var end = process.hrtime(start);
                log.info("Completed rebuild app index batch task in: " + prettyHrtime(end));
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({"status": "Rebuild app index task started"});
    });

    app.post('/index/app/snapshot', function (req, res) {
        var batchSize = req.body.batchSize;
        if (!batchSize || isNaN(batchSize)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        log.info("Starting app snapshot batch task");
        var start = process.hrtime();
        appSnapshot.createSnapshotPromise(batchSize)
            .then(function(result) {
                log.info("Successfully create snapshot: " + result.snapshot + " of index: " + result.index);
                log.info("Subscriber responses: " + JSON.stringify(result.subscribers));

                var end = process.hrtime(start);
                log.info("Completed app snapshot batch task in: " + prettyHrtime(end));
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({ "status": "App snapshot task started" });
    });

    app.delete('/index/app/snapshots', function (req, res) {
        var numToKeep = req.body.numToKeep;
        if (isNaN(numToKeep) || numToKeep < 0) {
            return res.status(400).send('Bad numToKeep parameter');
        }

        log.info("Starting delete app snapshots task");
        var start = process.hrtime();
        appSnapshot.deleteOldSnapshotsPromise(numToKeep)
            .then(function(deletedSnapshots) {
                {
                    log.info("Deleted snapshots: " + JSON.stringify(deletedSnapshots));

                    var end = process.hrtime(start);
                    log.info("Completed delete app snapshots batch task in: " + prettyHrtime(end));
                }
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({ "status": "Delete app snapshots task started" });
    });

    app.delete('/index/app/inactive', function (req, res) {
        log.info("Starting app delete inactive indices task");
        var start = process.hrtime();
        appIndexer.deleteInactiveIndicesPromise()
            .then(function() {
                {
                    var end = process.hrtime(start);
                    log.info("Completed app delete inactive indices task in: " + prettyHrtime(end));
                }
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({ "status": "Delete app inactive indices task started" });
    });

    app.post('/index/app/restore', function (req, res, next) {
        var snapshot = req.body.snapshot;
        if (!snapshot) {
            return res.status(400).send('snapshot parameter required');
        }

        log.info("Starting app restore batch task");
        var start = process.hrtime();
        appRestore.restoreSnapshotPromise(snapshot)
            .then(function(restoredIndex) {
                log.info("App index successfully restored: " + restoredIndex);

                var end = process.hrtime(start);
                log.info("Completed app restore batch task in: " + prettyHrtime(end));
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({ "status": "App restore task started" });
    });

    var restoreLatest = function(req, res) {
        log.info("Starting app restore latest batch task");
        var start = process.hrtime();
        appRestore.restoreLatestSnapshotPromise()
            .then(function(restoredIndex) {
                log.info("App index successfully restored: " + restoredIndex);

                var end = process.hrtime(start);
                log.info("Completed app restore latest batch task in: " + prettyHrtime(end));
            })
            .fail(function(err) {
                log.error(err);
            });

        res.json({ "status": "App restore latest task started" });
    };

    app.post('/index/app/restore_latest', function (req, res) {
        restoreLatest(req, res);
    });

    app.get('/index/app/restore_latest', function (req, res) {
        restoreLatest(req, res);
    });
};
