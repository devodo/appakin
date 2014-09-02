"use strict";

var appakinRepo = require("../../repos/appStoreRepo");
var connection = require("../../repos/connection");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetCategories: function (test) {
        appakinRepo.getCategories(function(err, results) {
            test.expect(2);
            test.ok(!err, err);
            test.ok(results.length > 0);
            connection.end();
            test.done();
        });
    }
};
