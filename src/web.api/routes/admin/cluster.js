'use strict';

var log = require('../../logger');
var clusterSearcher = require('../../domain/search/clusterSearcher');
var uuidUtil = require('../../domain/uuidUtil');

exports.init = function init(app) {
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

    app.get('/admin/cluster/app_keywords/:seedCategoryId/:appExtId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        var appExtId = req.params.appExtId;

        if (!appExtId || appExtId.trim() === '') {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        clusterSearcher.getAppTopKeywords(seedCategoryId, appExtId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/training_terms/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).send('Bad seed category Id query parameter');
        }

        clusterSearcher.getTrainingSetTopTerms(seedCategoryId, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/admin/cluster/category_terms/:categoryId', function (req, res, next) {
        var categoryId = req.params.categoryId;

        if (!categoryId || isNaN(categoryId)) {
            return res.status(400).send('Bad category id query parameter');
        }

        clusterSearcher.getCategoryTopKeywords(categoryId, function (err, result) {
            if (err) { return next(err); }

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

    app.delete('/admin/classification/train', function (req, res, next) {
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
