"use strict";

var appStoreRepo = require("../../repos/appStoreRepo");
var connection = require("../../repos/connection");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        connection.end();
        callback();
    },

    testGetCategories: function (test) {
        appStoreRepo.getCategories(function(err, results) {
            test.expect(2);
            test.ok(!err, err);
            test.ok(results.length > 0);
            test.done();
        });
    },

    resetCategoryPopularities: function(test) {
        return test.done(); //disable

        appStoreRepo.resetCategoryPopularities(3, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    resetAppPopularities: function(test) {
        return test.done(); //disable

        appStoreRepo.resetAppPopularities(3, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};
