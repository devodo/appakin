'use strict';

var appSearcher = require('../elasticsearch/appSearcher');
var log = require('../logger');

var parseFilters = function(req) {
    return {
        isIphone: req.query.isIphone === 'true',
        isIPad: req.query.isIpad === 'true',
        isFree: req.query.isFree === 'true'
    };
};

exports.init = function init(app) {
    app.get('/search/main', function (req, res, next) {
        var startTime = process.hrtime();

        var query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query parameter'});
        }

        var appFrom = req.query.appFrom ? parseInt(req.query.appFrom, 10) : 0;
        if (isNaN(appFrom) || appFrom < 0) {
            return res.status(400).json({error: 'Bad appFrom parameter'});
        }

        var appSize = req.query.appSize ? parseInt(req.query.appSize, 10) : 5;
        if (isNaN(appSize) || appSize < 0) {
            return res.status(400).json({error: 'Bad appSize parameter'});
        }

        var catFrom = req.query.catFrom ? parseInt(req.query.catFrom, 10) : 0;
        if (isNaN(catFrom) || catFrom < 0) {
            return res.status(400).json({error: 'Bad catFrom parameter'});
        }

        var catSize = req.query.catSize ? parseInt(req.query.catSize, 10) : 5;
        if (isNaN(catSize) || catSize < 0) {
            return res.status(400).json({error: 'Bad catSize parameter'});
        }

        var catAppFrom = req.query.catAppFrom ? parseInt(req.query.catAppFrom, 10) : 0;
        if (isNaN(catAppFrom) || catAppFrom < 0) {
            return res.status(400).json({error: 'Bad catAppFrom parameter'});
        }

        var catAppSize = req.query.catAppSize ? parseInt(req.query.catAppSize, 10) : 5;
        if (isNaN(catAppSize) || catAppSize < 0) {
            return res.status(400).json({error: 'Bad catAppSize parameter'});
        }

        var filters = parseFilters(req);

        appSearcher.searchMain(query, appFrom, appSize, catFrom, catSize, catAppFrom, catAppSize, filters, function(err, result) {
            if (err) { return next(err); }

            var diffTime = process.hrtime(startTime);

            var took = (diffTime[0] * 1e9 + diffTime[1]) / 1000000;

            res.json({
                took: took,
                result: result
            });
        });
    });

    app.get('/search/complete', function (req, res, next) {
        var startTime = process.hrtime();

        var query = req.query.q;
        if (!query || query.trim() === '') {
            return res.status(400).json({error: 'Bad query parameter'});
        }

        var size = req.query.size ? parseInt(req.query.size, 10) : 5;
        if (isNaN(size) || size < 0) {
            return res.status(400).json({error: 'Bad size parameter'});
        }

        appSearcher.searchComplete(query, size, function(err, result) {
            if (err) { return next(err); }

            var diffTime = process.hrtime(startTime);

            var took = (diffTime[0] * 1e9 + diffTime[1]) / 1000000;

            res.json({
                took: took,
                result: result
            });
        });
    });
};
