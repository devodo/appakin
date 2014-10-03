'use strict';

var autoSearcher = require('../domain/search/autoSearcher');
var catSearcher = require('../domain/search/categorySearcher');
var appSearcher = require('../domain/search/appSearcher');

exports.init = function init(app) {

    app.get('/ios/search/auto', function (req, res) {
        var query = req.query.q;

        if (!query || query.trim() === '') {
            return res.status(400).send('Bad query string');
        }

        autoSearcher.search(query, 1, function(err, result) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json(result.suggestions);
        });
    });

    app.get('/ios/search/cat', function (req, res) {
        var query = req.query.q;
        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;

        if (!query || query.trim() === '' || isNaN(pageNum)) {
            return res.status(400).send('Bad query string');
        }

        catSearcher.search(query, pageNum, function (err, result) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json(result);
        });
    });

    app.get('/ios/search/app', function (req, res) {
        var query = req.query.q;
        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;

        if (!query || query.trim() === '' || isNaN(pageNum)) {
            return res.status(400).send('Bad query string');
        }

        appSearcher.search(query, pageNum, function(err, result) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json(result);
        });
    });

};
