'use strict';
var appStoreData = require("../domain/dataProvider/appStoreDataProvider");

exports.init = function init(app) {

    app.post('/api/appstore/retrieve', function (req, res) {

        var id = req.body.id;

        appStoreData.retrieveApp(id, function(err, data) {
            if (err) {
                return res.status(500).send(err);
            }

            res.json({status: 'success'});
        });
    });
};


