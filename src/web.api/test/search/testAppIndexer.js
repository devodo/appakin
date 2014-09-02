"use strict";

var appIndexer = require("../../domain/search/appIndexer");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    addAllApps: function (test) {
        //return test.done(); // skip
        appIndexer.addAllApps(10000, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};
