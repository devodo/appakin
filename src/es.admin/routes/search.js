'use strict';

var appSearcher = require('../elasticsearch/appSearcher');
var log = require('../logger');

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

        var catSize = req.query.catSize ? parseInt(req.query.catSize, 10) : 10;
        if (isNaN(catSize) || catSize < 0) {
            return res.status(400).json({error: 'Bad catSize parameter'});
        }

        appSearcher.searchMain(query, appFrom, appSize, catFrom, catSize, function(err, result) {
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