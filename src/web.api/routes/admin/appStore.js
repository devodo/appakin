'use strict';
var appStoreData = require("../../domain/dataProvider/appStoreDataProvider");

exports.init = function init(app) {

    app.post('/admin/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        appStoreData.retrieveApp(id, function(err, data) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json({status: 'success'});
        });
    });

    app.get('/admin/appstore/insert_missing_xyo_categories', function (req, res) {
        appStoreData.insertMissingXyoCategories(function(err, results) {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);
        });
    });
};


