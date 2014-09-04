"use strict";

var searcher = require("../../domain/search/autoSearcher");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testSearch: function (test) {
        return test.done();

        var queryStr = 'spot';

        searcher.search(queryStr, 1, function(err, result) {
            test.expect(2);
            test.ok(!err, err);
            test.ok(result, 'No result returned');
            test.done();
        });
    }
};
