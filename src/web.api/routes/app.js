'use strict';

exports.init = function init(app) {

    app.get('/api/:platform/app/:appName', function (req, res) {
        var platform = req.params.platform;

        setTimeout(
            function() {
                res.json({
                    name: 'Nike Shoe',
                    desc: 'This is a long description about this app',
                    urlName: req.params.appName,
                    platform: platform,
                    categories: [
                        {
                            name: 'Running apps',
                            shortDesc: 'Apps for tracking your runs.',
                            urlName: 'running',
                            platform: platform
                        },
                        {
                            name: 'Games for children aged 3 to 5',
                            shortDesc: 'Fun games that help your child learn about the world.',
                            urlName: 'games-for-children-aged-3-to-5',
                            platform: platform
                        },
                        {
                            name: 'Drawing apps',
                            shortDesc: 'Apps for sketching on your phone',
                            urlName: 'drawing-apps',
                            platform: platform
                        }
                    ]
                });
            },
            200);
    });

};
