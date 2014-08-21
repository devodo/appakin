'use strict';

exports.init = function init(app) {

    app.get('/api/search', function (req, res) {
        // TODO: the results will need to be ordered somehow, such as by popularity of category and closeness of match?
        res.json({
            platform: 'ios',
            categories: [
                {name: 'Running apps',
                    shortDesc: 'Apps for tracking your runs.',
                    urlName: 'running'},
                {name: 'Games for children aged 3 to 5',
                    shortDesc: 'Fun games that help your child learn about the world.',
                    urlName: 'games-for-children-aged-3-to-5'},
                {name: 'Drawing apps',
                    shortDesc: 'Apps for sketching on your phone',
                    urlName: 'drawing-apps'}
            ],
            paging: {
                page: 1,
                totalPages: 4
            }
        });
    });

};
