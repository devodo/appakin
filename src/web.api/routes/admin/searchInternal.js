'use strict';

var autoIndexer = require('../../domain/search/autoIndexer');

exports.init = function init(app) {
    app.get('/api/admin/search/rebuild_auto', function (req, res) {
        var appBatchSize = 10000;

        res.contentType("text/plain; charset=UTF-8");
        res.write("Starting rebuild of auto complete index\n");

        var outputHandler = function(msg) {
            res.write(msg + '\n');
        };

        autoIndexer.rebuild(appBatchSize, outputHandler, function(err) {
            if (err) {
                res.write(JSON.stringify(err));
            }
            else {
                res.write("Rebuild completed successfully\n");
            }

            res.end();
        });
    });
};
