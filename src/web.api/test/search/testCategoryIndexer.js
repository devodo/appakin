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

        categoryIndexer.addAllCategories(20, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    testGetTopText: function (test) {
        var text = "The quick brown fox jumps over the lazy dog";
        var posi = "1234567890123456789012345678901234567890123";

        var r1 = categoryIndexer.getTopWords(text, 10);
        var r2 = categoryIndexer.getTopWords(text, 0);
        var r3 = categoryIndexer.getTopWords(text, 1000);
        var r4 = categoryIndexer.getTopWords(posi, 10);
        var r5 = categoryIndexer.getTopWords(text, 23);
        var r6 = categoryIndexer.getTopWords(text, 9);
        test.expect(6);
        test.equals(r1, "The quick");
        test.equals(r2, "");
        test.equals(r3, text);
        test.equals(r4, "");
        test.equals(r5, "The quick brown fox");
        test.equals(r6, "The quick");
        test.done();
    }
};
