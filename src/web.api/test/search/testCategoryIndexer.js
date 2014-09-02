"use strict";

var categoryIndexer = require("../../domain/search/categoryIndexer");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testAddCategory: function (test) {
        return test.done(); // ignore test

        var category = {
            id: '1',
            name: 'test category',
            description: 'test description',
            url: 'test-category'
        };

        var appDescriptions = [
            'app description 1',
            'app description 2'
        ];

        categoryIndexer.addCategory(category, appDescriptions, function(err, resp) {
            test.expect(2);
            test.ok(!err, err);
            test.ok(resp, "No response");
            test.done();
        });
    },

    addAllCategories: function (test) {
        return test.done(); // ignore test
        categoryIndexer.addAllCategories(function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};
