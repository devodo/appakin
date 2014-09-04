"use strict";

var autoIndexer = require("../../domain/search/autoIndexer");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    addAllApps: function (test) {
        return test.done(); // disable

        autoIndexer.addAllAuto(10000, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};
