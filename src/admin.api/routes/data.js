'use strict';

var log = require('../logger');
var categoryClassification = require('../domain/dataAdmin/categoryClassification');

exports.init = function init(app) {
    app.post('/admin/data/reload_all_seed_category_apps', function (req, res, next) {
        categoryClassification.reloadAllSeedCategoryApps(function (err) {
            if (err) { return next(err); }

            res.json({ "status": "success" });
        });
    });

    app.post('/admin/data/reload_seed_category_apps/:seedCategoryId', function (req, res, next) {
        var seedCategoryId = req.params.seedCategoryId;

        if (!seedCategoryId || isNaN(seedCategoryId)) {
            return res.status(400).json({error: 'Bad seed category Id query parameter'});
        }

        categoryClassification.reloadSeedCategoryApps(seedCategoryId, function (err) {
            if (err) { return next(err); }

            res.json({ "status": "success" });
        });
    });

    app.post('/admin/data/transfer_all_seed_category_apps', function (req, res, next) {
        categoryClassification.transferAllSeedCategoryApps(function (err) {
            if (err) { return next(err); }

            res.json({ "status": "success" });
        });
    });
};

