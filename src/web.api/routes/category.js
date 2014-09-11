'use strict';

exports.init = function init(app) {

    app.get('/:platform/category/:categoryName', function (req, res) {

        setTimeout(
            function() {
                res.json({
                    name: 'Running apps',
                    desc: 'This is a long description about this category',
                    urlName: req.params.categoryName,
                    platform: req.params.platform,
                    apps: [
                        {
                            name: 'Some app 1',
                            shortDesc: 'A short description',
                            urlName: 'some-app-1',
                            platform: req.params.platform
                        },
                        {
                            name: 'Some app 2',
                            shortDesc: 'A short description',
                            urlName: 'some-app-2',
                            platform: req.params.platform
                        }
                    ]
                });
            },
            600);
    });

};
