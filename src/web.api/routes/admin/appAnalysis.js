'use strict';

var appAnalyser = require('../../domain/analysis/appAnalyser');
var log = require('../../logger');

exports.init = function init(app) {

    app.post('/admin/analyse/apps', function (req, res) {
        var batchSize = 100;
        log.debug("Starting analysis of apps");

        appAnalyser.analyse(batchSize, function(err) {
            if (err) {
                log.error(err);
                return res.status(500).json(err);
            }

            res.json({status: 'success'});
        });
    });

};
