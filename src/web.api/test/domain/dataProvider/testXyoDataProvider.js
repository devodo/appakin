"use strict";

var xyoDataProvider = require("../../../domain/dataProvider/xyoDataProvider");
var connection = require("../../../repos/connection");
var fs = require('fs');

exports.group = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        connection.end();
        callback();
    },

    crawlCategories: function(test) {
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

        for (var i = 60; i < 84; i++) {
            seedUrls.push('http://xyo.net/iphone/?page=' + i);
        }

        xyoDataProvider.crawlCategories(seedUrls, function(err, count) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    testCrawlCategoryApps: function(test) {
        return test.done();

        var category = {
            url: 'http://xyo.net/iphone-apps/social-networking-kew/'
        };

        xyoDataProvider.crawlCategoryApps(category, 2, function(err, items) {
            test.expect(2);
            test.ok(!err, err);
            test.ok(items.length > 0, "No items retrieved");
            test.done();
        });
    },

    retrieveAllCategoryApps: function(test) {
        return test.done();
        xyoDataProvider.retrieveAllCategoryApps(2, 100, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};