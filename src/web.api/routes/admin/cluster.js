'use strict';

var log = require('../../logger');
var clusterSearcher = require('../../domain/search/clusterSearcher');

exports.init = function init(app) {
    app.get('/admin/search/cluster_name', function (req, res, next) {
        var appId = req.query.app_id;
        var rows = req.query.rows;

        if (!appId || appId.trim() === '') {
            return res.status(400).send('Bad app id string');
        }

        if (!rows || isNaN(rows)) {
            return res.status(400).send('Bad rows query string');
        }

        clusterSearcher.searchSimilarByName(appId, rows, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/keywords/:appId', function (req, res, next) {
        var appId = req.params.appId;
        var rows = req.query.rows ? parseInt(req.query.rows, 10) : 1000;

        if (!appId || appId.trim() === '') {
            return res.status(400).send('Bad app id string');
        }

        if (isNaN(rows)) {
            return res.status(400).send("Bad rows request parameter");
        }

        clusterSearcher.getKeywords(appId, rows, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/:appId', function (req, res, next) {
        var appId = req.params.appId;

        if (!appId || appId.trim() === '') {
            return res.status(400).send('Bad app id string');
        }

        clusterSearcher.search(appId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/category/:categoryId/:appId', function (req, res, next) {
        var categoryId = req.params.categoryId;

        if (!categoryId || categoryId.trim() === '') {
            return res.status(400).send('Bad category id string');
        }

        var appId = req.params.appId;

        if (!appId || appId.trim() === '') {
            return res.status(400).send('Bad app id string');
        }

        clusterSearcher.searchCategory(appId, categoryId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/training_test', function (req, res, next) {
        clusterSearcher.runTrainingTest(function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.post('/admin/cluster/cluster_test', function (req, res, next) {
        clusterSearcher.runClusterTest(1000, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/cluster_category_test/:categoryId', function (req, res, next) {
        var categoryId = req.params.categoryId;

        if (!categoryId || categoryId.trim() === '') {
            return res.status(400).send('Bad category id string');
        }

        clusterSearcher.runClusterCategoryTest(categoryId, '8c7007d88a024096b00b68f92b68dfcd', function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/search_seed_app/:seedId', function (req, res, next) {
        var seedId = req.params.seedId;
        var boost = req.query.boost && !isNaN(req.query.boost) ? parseFloat(req.query.boost) : 1;

        if (!seedId || isNaN(seedId)) {
            return res.status(400).send('Bad seed Id query parameter');
        }

        clusterSearcher.getSeedApps(seedId, boost, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/seed_keywords/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        clusterSearcher.getSeedCategoryKeywords(seedCategoryId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/classify/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        clusterSearcher.classifySeedCategory(seedCategoryId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });
};
