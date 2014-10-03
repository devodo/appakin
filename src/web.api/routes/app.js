'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');

var PAGE_SIZE = 10;

exports.init = function init(app) {

    app.get('/ios/app/:encodedId/:slug', function (req, res) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).send('Bad query string');
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).send('Bad app id');
        }

        appStoreRepo.getAppByExtId(extId, function(err, app) {
            if (err) {
                log.error(err);
                return res.status(500).send('Error retrieving app data');
            }

            if (!app) {
                return res.status(404).send('App not found');
            }

            var urlName = urlUtil.slugifyName(app.name);
            var appUrl = urlUtil.makeUrl(app.extId, app.name);
            if (req.params.slug !== urlName) {
                return res.redirect(301, '/ios/app/' + appUrl);
            }

            appStoreRepo.getAppCategories(app.id, 0, PAGE_SIZE, function(err, cats) {
                if (err) {
                    log.error(err);
                    return res.status(500).send('Error retrieving app category data');
                }

                cats.forEach(function(cat) {
                    cat.url = urlUtil.makeUrl(cat.extId, cat.name);
                    delete cat.extId;
                });

                app.url = appUrl;
                app.categories = cats;

                delete app.id;
                delete app.extId;
                delete app.dateCreated;

                res.json(app);
            });
        });
    });

};
