'use strict';

var autoSearcher = require('../domain/search/autoSearcher');
var catViewProvider = require('../domain/viewProvider/categoryViewProvider');
var appSearcher = require('../domain/search/appSearcher');

var MAX_CAT_APP_PAGES = 8;

exports.init = function init(app) {

    app.get('/ios/search/auto', function (req, res, next) {
        var query = req.query.q;

        if (!query || query.trim() === '') {
            return res.status(400).send('Bad query string');
        }

        autoSearcher.search(query, 1, function(err, result) {
            if (err) { return next(err); }

            res.json(result.suggestions);
        });
    });

    app.get('/ios/search/cat', function (req, res, next) {
        var query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).send('Bad query string');
        }

        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).send("Bad page number");
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        catViewProvider.searchCategories(query, pageNum, filters, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/ios/search/cat_app', function (req, res, next) {
        var query = req.query.q;
        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        var categoryId = req.query.cat_id;

        if (!query || query.trim() === '') {
            return res.status(400).send('Bad query string');
        }

        if (!categoryId || categoryId.trim() === '') {
            return res.status(400).send('Bad category id');
        }

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_APP_PAGES) {
            return res.status(400).send("Page number must be between 1 and " + MAX_CAT_APP_PAGES);
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        catViewProvider.searchApps(query, pageNum, categoryId, filters, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/ios/search/app', function (req, res, next) {
        var query = req.query.q;
        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;

        if (!query || query.trim() === '') {
            return res.status(400).send('Bad query string');
        }

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).send("Bad page number");
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appSearcher.search(query, pageNum, filters, function(err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

};
