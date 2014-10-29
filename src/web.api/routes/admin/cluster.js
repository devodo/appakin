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

        if (!appId || appId.trim() === '') {
            return res.status(400).send('Bad app id string');
        }

        clusterSearcher.getKeywords(appId, function (err, result) {
            if (err) {
                return next(err);
            }

            res.json(result);
        });
    });

    app.get('/admin/cluster/category/:appId', function (req, res, next) {
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
};
