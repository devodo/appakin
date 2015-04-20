'use strict';

var autoSearcher = require('../domain/search/autoSearcher');
var catViewProvider = require('../domain/viewProvider/categoryViewProvider');
var appSearcher = require('../domain/search/elasticSearch/appSearcher');

var MAX_CAT_APP_PAGES = 8;

exports.init = function init(app) {

    app.use('/ios/search/*', function (req, res, next) {
        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);
        next();
    });

    app.get('/ios/search/auto', function (req, res, next) {
        var query = req.query.q;

        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query string'});
        }

        appSearcher.searchComplete(query, function(err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/ios/search/cat', function (req, res, next) {
        var query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query string'});
        }

        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({error: 'Bad page number'});
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

    app.get('/ios/search/main', function (req, res, next) {
        var query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query string'});
        }

        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        catViewProvider.searchMain(query, pageNum, filters, function (err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

    app.get('/ios/search/cat_app', function (req, res, next) {
        var query = req.query.q;
        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        var categoryId = req.query.cat_id;

        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query string'});
        }

        if (!categoryId || categoryId.trim() === '') {
            return res.status(400).json({error: 'Bad category id'});
        }

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_APP_PAGES) {
            return res.status(400).json({error: 'Page number must be between 1 and ' + MAX_CAT_APP_PAGES});
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
            return res.status(400).json({error: 'Bad query string'});
        }

        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appSearcher.searchApps(query, pageNum, filters, function(err, result) {
            if (err) { return next(err); }

            res.json(result);
        });
    });

};
