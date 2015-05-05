'use strict';

var request = require('request');
var config = require('../../config');

exports.triggerIndexSnapshot = function(batchSize, next) {
    var queryUrl = config.search.esAdmin.url + 'index/app/snapshot';
    var body = {
        batchSize: batchSize
    };

    request({
        url: queryUrl,
        body: body,
        pool: false,
        json: true,
        method: 'POST'
    }, function (err, resp) {
        if (err) { return next(err); }

        if (resp.statusCode !== 200) {
            return next(new Error('Unexpected response status code: ' + resp.statusCode));
        }

        next();
    });
};
