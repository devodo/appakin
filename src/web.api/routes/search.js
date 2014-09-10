'use strict';

var autoSearcher = require('../domain/search/autoSearcher');
var catSearcher = require('../domain/search/categorySearcher');

exports.init = function init(app) {

    app.get('/api/search/appstore/auto', function (req, res) {
        var query = req.query.q || '';

        if (query === '') {
            res.status(400).send('Bad query string');
            return;
        }

        autoSearcher.search(query, 1, function(err, result) {
            if (err) {
                return res.status(500).send(err);
            }

            var docs = result.docs.map(function(doc) {
                return doc.name_display;
            });

            res.json(docs);
        });
    });

    app.get('/api/search/appstore/cat', function (req, res) {
        var query = req.query.q || '';
        var pageNum = 1;

        if (req.query.p) {
            pageNum = parseInt(req.query.p, 10);
        }

        if (query === '' || isNaN(pageNum)) {
            return res.status(400).send('Bad query string');
        }

        catSearcher.search(query, 1, function(err, result) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json(result);
        });
    });

    app.get('/api/search', function (req, res) {
        var query = req.query.q || '';
        var platform = req.query.p || '';
        var page = req.query.page;
        var take = req.query.take;

        if (query === '' || platform === '' || isNaN(page) || isNaN(take)) {
            res.status(400).send('Bad query string');
            return;
        }

        if (query === 'none') {
            res.json({
                page: page,
                totalItems: 0,
                categories: []
            });

            return;
        }

        if (query === 'timeout') {
            setTimeout(function() { res.json({}); }, 5000);
            return;
        }

        if (query === 'error') {
            setTimeout(function() { res.status(500).send('Deliberate error'); }, 200);
        }

        setTimeout(
            function() {
                res.json({
                    page: page,
                    totalItems: 100,
                    categories: [
                        {
                            name: page + ' ' + query + ' ' + platform + ' Running apps',
                            shortDesc: 'Apps for tracking your runs.',
                            urlName: 'running',
                            platform: platform
                        },
                        {
                            name: page + ' ' + query + ' ' + platform + ' Games for children aged 3 to 5',
                            shortDesc: 'Fun games that help your child learn about the world.',
                            urlName: 'games-for-children-aged-3-to-5',
                            platform: platform
                        },
                        {
                            name: page + ' ' + query + ' ' + platform + ' Drawing apps',
                            shortDesc: 'Apps for sketching on your phone',
                            urlName: 'drawing-apps',
                            platform: platform
                        }
                    ]
                });
            },
            300);
    });

};
