"use strict";

var xyoData = require("../../domain/xyoData.js");
var fs = require('fs');

exports.group = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testGetPageSrc: function(test) {
        return test.done();

        var seedUrls = [
            //'http://xyo.net/iphone/',
            //'http://xyo.net/iphone-apps/developer-resources-kmI/',
            //'http://xyo.net/iphone-games/movie-trivia-kIM/',
            //'http://xyo.net/iphone-apps/history-apps-kVM/',
            //'http://xyo.net/iphone-apps/flight-apps-lGI/',
            //'http://xyo.net/iphone-apps/chinese-language-and-culture-kgg/',
            //'http://xyo.net/iphone-games/cats-mice-and-dogs-games-kOY/'
        ];

        xyoData.crawl(seedUrls, function(err, count) {
            test.expect(1);
            test.ok(err === null, err);
            test.done();
        });
    },

    testGetCategoryItems: function(test) {
        return test.done();

        var category = {
            url: 'http://xyo.net/iphone-apps/social-networking-kew/'
        };

        xyoData.retrieveCategoryItems(category, 2, function(err, items) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(items.length > 0, "No items retrieved");
            test.done();
        });
    },

    testGetCategories: function(test) {
        xyoData.getCategories(function(err, categories) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(categories.length > 0, "No categories retrieved");
            test.done();
        });
    },

    testCrawlAllCategories: function(test) {
        xyoData.crawlAllCategories(10, function(err) {
            test.expect(1);
            test.ok(err === null, err);
            test.done();
        });
    }
};