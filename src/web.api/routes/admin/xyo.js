'use strict';
var xyoData = require("../../domain/dataProvider/xyoDataProvider");

exports.init = function init(app) {

    app.get('/admin/xyo/lookupCategoryLinks', function (req, res) {
        var categoryUrl = 'http://xyo.net/iphone-apps/social-networking-kew/';

        xyoData.lookupCategoryLinks(categoryUrl, function(err, categories) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json(categories);
        });
    });

    app.get('/admin/xyo/retrieveAllCategoryLinks', function (req, res) {
        xyoData.retrieveAllCategoryLinks(1, function(err) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json({"success": true});
        });
    });
};


