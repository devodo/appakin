'use strict';

var log = require('../../logger');
var autoIndexer = require('../../domain/search/autoIndexer');
var catIndexer = require('../../domain/search/categoryIndexer');
var appIndexer = require('../../domain/search/appIndexer');
var clusterIndexer = require('../../domain/search/clusterIndexer');
var clusterSearcher = require('../../domain/search/clusterSearcher');

exports.init = function init(app) {
    app.post('/admin/search/auto/rebuild', function (req, res) {
        log.debug("Starting rebuild of auto complete index");

        var batchSize = 10000;
        var maxNgramDepth = 6;

        autoIndexer.rebuild(batchSize, maxNgramDepth, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/search/cat/rebuild', function (req, res) {
        var numAppDescriptions = 10;
        var numChartApps = 6;

        log.debug("Starting rebuild of category index");

        catIndexer.rebuild(numAppDescriptions, numChartApps, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/search/app/rebuild', function (req, res) {
        var batchSize = 10000;
        log.debug("Starting rebuild of app index");

        appIndexer.rebuild(batchSize, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/search/cluster/rebuild', function (req, res) {
        var batchSize = 10000;
        log.debug("Starting rebuild of cluster index");

        clusterIndexer.rebuild(batchSize, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

    app.get('/admin/search/cat/keywords/:catid', function (req, res) {
        var categoryId = parseInt(req.params.catid, 10);

        if (isNaN(categoryId)) {
            return res.status(400).send('Bad query string');
        }

        catIndexer.getCategoryKeywords(categoryId, function(err, keywords) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(keywords);
        });
    });

    app.post('/admin/search/cat/save_corpusfreq', function (req, res) {
        catIndexer.saveCorpusTermFrequency(function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({ "result": "success"});
        });
    });

    app.post('/admin/search/cat/exclude_app', function (req, res) {
        var categoryExtId = req.body.categoryExtId;
        var appExtId = req.body.appExtId;

        log.debug("Excluding app " + appExtId + " from category " + categoryExtId);
    });
};
