'use strict';

var log = require('../../logger');
var clusterSearcher = require('../../domain/search/clusterSearcher');
var uuidUtil = require('../../domain/uuidUtil');

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

        clusterSearcher.getTopTerms(appId, rows, function (err, result) {
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

        if (!seedId || isNaN(seedId)) {
            return res.status(400).send('Bad seed Id query parameter');
        }

        var boost = req.query.boost && !isNaN(req.query.boost) ? parseFloat(req.query.boost) : 1;
        var skip = req.query.skip && !isNaN(req.query.skip) ? parseInt(req.query.skip, 10): 0;
        var take = req.query.take && !isNaN(req.query.take) ? parseInt(req.query.take, 10): 400;

        clusterSearcher.getSeedApps(seedId, boost, skip, take, function (err, result) {
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

    app.get('/admin/cluster/app_keywords/:appExtId', function (req, res, next) {
        var appExtId = req.params.appExtId;

        if (!appExtId || appExtId.trim() === '') {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        clusterSearcher.getAppTopKeywords(appExtId, function (err, result) {
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

        var saveResults = req.query.save === 'true';

        clusterSearcher.classifySeedCategory(seedCategoryId, saveResults, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/classified_apps/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        var skip = parseInt(req.query.skip, 10);

        if (req.query.skip && isNaN(skip)) {
            return res.status(400).send('Bad skip parameter');
        }

        skip = isNaN(skip) ? 0 : skip;

        var take = parseInt(req.query.take, 10);

        if (req.query.take && isNaN(take)) {
            return res.status(400).send('Bad take parameter');
        }

        take = isNaN(take) ? 100 : take;

        var isInclude = req.query.include !== 'false';

        if (isInclude && req.query.include && req.query.include !== 'true') {
            return res.status(400).send('Bad include parameter');
        }

        clusterSearcher.getClassificationApps(seedCategoryId, isInclude, skip, take, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.post('/admin/classification/train', function (req, res, next) {
        var seedCategoryId = req.body.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        var appExtId = req.body.appExtId;

        if (!uuidUtil.isValid(appExtId)) {
            return res.status(400).send('Bad appExtId parameter');
        }

        if (typeof req.body.include !== 'boolean') {
            return res.status(400).send('Bad include parameter');
        }

        var isIncluded =  req.body.include;

        clusterSearcher.insertSeedTraining(seedCategoryId, appExtId, isIncluded, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.del('/admin/classification/train', function (req, res, next) {
        var seedCategoryId = req.query.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        var appExtId = req.query.appExtId;

        if (!uuidUtil.isValid(appExtId)) {
            return res.status(400).send('Bad appExtId parameter');
        }

        clusterSearcher.deleteSeedTraining(seedCategoryId, appExtId, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/admin/classification/training/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        clusterSearcher.getSeedTrainingSet(seedCategoryId, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });
};
