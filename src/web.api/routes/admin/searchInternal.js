'use strict';

var log = require('../../logger');
var autoIndexer = require('../../domain/search/autoIndexer');
var catIndexer = require('../../domain/search/categoryIndexer');
var appIndexer = require('../../domain/search/appIndexer');
var clusterIndexer = require('../../domain/search/clusterIndexer');
var solrCore = require('../../domain/search/solrCore');

exports.init = function init(app) {
    app.post('/admin/search/auto/rebuild', function (req, res) {
        log.debug("Starting rebuild of auto complete index");

        var batchSize = 10000;
        var maxNgramDepth = 6;

        autoIndexer.rebuild(batchSize, maxNgramDepth, function(err) {
            if (err) {
                log.error(err);
            }
        });

        res.json({status: 'rebuild started'});
    });

    app.get('/admin/search/auto/status', function (req, res, next) {

        autoIndexer.getCoreStatus(function(err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.post('/admin/search/cat/rebuild', function (req, res) {
        log.debug("Starting rebuild of category index");

        catIndexer.rebuild(function(err) {
            if (err) {
                log.error(err);
            }
        });

        res.json({status: 'rebuild started'});
    });

    app.get('/admin/search/cat/index/:categoryId', function (req, res) {
        var categoryId = parseInt(req.params.categoryId, 10);

        if (isNaN(categoryId)) {
            return res.status(400).json({error: 'Bad category id in query string'});
        }

        log.debug("Starting index of category: " + categoryId);

        catIndexer.rebuildCategory(categoryId, function(err) {
            if (err) {
                log.error(err);
            }
        });

        res.json({status: 'rebuild started'});
    });

    app.post('/admin/search/app/rebuild', function (req, res) {
        var batchSize = 10000;
        log.debug("Starting rebuild of app index");

        appIndexer.rebuild(batchSize, function(err) {
            if (err) {
                log.error(err);
            }
        });

        res.json({status: 'rebuild started'});
    });

    app.post('/admin/search/app/index_app', function (req, res, next) {
        var appId = req.body.appId;

        appIndexer.indexApp(appId, function(err) {
            if (err) { return next(err); }

            res.json({status: 'success'});
        });
    });

    app.post('/admin/search/cluster/rebuild', function (req, res) {
        var batchSize = 10000;
        log.debug("Starting rebuild of cluster index");

        clusterIndexer.rebuild(batchSize, function(err) {
            if (err) {
                log.error(err);
            }
        });

        res.json({status: 'rebuild started'});
    });

    app.post('/admin/search/cluster/index_app', function (req, res, next) {
        var appId = req.body.appId;
        var forceIsEnglish = true;

        clusterIndexer.indexApp(appId, forceIsEnglish, function(err) {
            if (err) { return next(err); }

            res.json({status: 'success'});
        });
    });

    app.get('/admin/search/cat/keywords/:catid', function (req, res) {
        var categoryId = parseInt(req.params.catid, 10);

        if (isNaN(categoryId)) {
            return res.status(400).json({error: 'Bad query string'});
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
