'use strict';

exports.init = function init(app) {

    app.get('/api/search/autocomplete', function (req, res) {
        var query = req.query.q || '';
        var platform = req.query.p || '';

        if (query === '' || platform === '') {
            res.status(400).send('Bad query string');
            return;
        }

        if (/^no/.test(query)) {
            res.json([]);
        }

        res.json([
            'Apple',
            'Banana',
            'Happle',
            'mmm apples',
            'Coconut',
            'Facet'
            ]);
    });

    app.get('/api/search', function (req, res) {
        var query = req.query.q || '';
        var platform = req.query.p || '';
        var page = req.query.page;
        var take = req.query.take;

        if (query === '' || platform === '' || isNaN(page) || isNaN(take)) {
            res.status(400).send('Bad query string');
            return
        }

        if (query === 'none') {
            res.json({
                platform: platform,
                page: page,
                totalItems: 0,
                categories: [
                ]
            });

            return;
        }

        // TODO: the results will need to be ordered somehow, such as by popularity of category and closeness of match.
        res.json({
            platform: platform,
            page: page,
            totalItems: 100,
            categories: [
                {name: page + ' ' + query + ' ' + platform + ' Running apps',
                    shortDesc: 'Apps for tracking your runs.',
                    urlName: 'running'},
                {name: page + ' ' + query + ' ' + platform + ' Games for children aged 3 to 5',
                    shortDesc: 'Fun games that help your child learn about the world.',
                    urlName: 'games-for-children-aged-3-to-5'},
                {name: page + ' ' + query + ' ' + platform + ' Drawing apps',
                    shortDesc: 'Apps for sketching on your phone',
                    urlName: 'drawing-apps'}
            ]
        });
    });

};
