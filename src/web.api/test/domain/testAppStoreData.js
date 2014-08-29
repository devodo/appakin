"use strict";

var appStoreData = require("../../domain/appStoreData.js");
var fs = require('fs');

exports.group = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testGetPageSrc: function(test) {
        return test.done(); //ignore test

        appStoreData.getPageSrc('284910350', function(err, pageSrc) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(pageSrc.indexOf("Yelp") !== -1, "Page source does not contain expected content");
            test.done();
        });
    },

    testParseSrc: function(test) {
        fs.readFile('test/domain/files/AppStoreSrc.html', 'utf8', function(err, data) {
            test.expect(3);
            test.ok(err === null, err);

            appStoreData.parseHtml(data, function(err, result) {
                test.ok(err === null, err);
                test.equals(result.title, "Yelp");
                test.done();
            });
        });
    },

    testLookup: function(test) {
        return test.done(); //ignore test

        appStoreData.getLookup('284910350', function(err, result) {
            test.expect(2);
            test.ok(err === null, err);
            test.equals(result.results[0].trackName, "Yelp");
            test.done();
        });
    },

    testParseLookup: function(test) {
        fs.readFile('test/domain/files/AppStoreLookup.json', 'utf8', function(err, data) {
            test.expect(3);
            test.ok(err === null, err);

            appStoreData.parseLookup(JSON.parse(data).results[0], function(err, result) {
                test.ok(err === null, err);
                test.equals(result.name, "Yelp");
                test.done();
            });
        });
    },

    testRetrieveApp: function(test) {
        return test.done(); //ignore test

        appStoreData.retrieveApp('575588416', function(err, itemId) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(itemId > 0, "Item not inserted");
            test.done();
        });
    },

    testRetrieveCategories: function(test) {
        return test.done(); //ignore test

        appStoreData.retrieveCategories(function(err, results) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(results.length > 0, "No results returned");
            test.done();
        });
    },

    testRetrieveAppSources: function(test) {
        return test.done(); //ignore test

        var category = {
            id: 1,
            storeUrl: 'https://itunes.apple.com/us/genre/ios-books/id6018?mt=8'
        };

        appStoreData.retrieveAppSources(category, 'A', 1, function(err) {
            test.expect(1);
            test.ok(err === null, err);
            test.done();
        });
    },

    retrieveAllAppSources: function(test) {
        return test.done(); //ignore test

        appStoreData.retrieveAllAppSources(function(err) {
            test.expect(1);
            test.ok(err === null, err);
            test.done();
        });
    },

    testRetrieveAllApps: function(test) {
        return test.done(); //ignore test

        var mainLoop = function(startId, batchSize, next) {
            appStoreData.lookupAppsBatched(startId, batchSize, function(err, lastId) {
                if (err) {
                    return next(err);
                }

                if (lastId) {
                    return mainLoop(lastId, batchSize, next);
                }

                next();
            });
        };

        mainLoop(539764, 200, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    testRetrievePopularApps: function(test) {
        return test.done(); //ignore test

        appStoreData.retrievePopularAppSourcesBatch(3, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    lookupMissingPopularApps: function(test) {
        return test.done(); //ignore test

        appStoreData.lookupMissingPopularApps(function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    lookupMissingSourceApps: function(test) {
        return test.done(); //ignore test

        appStoreData.lookupMissingSourceApps(function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    }
};