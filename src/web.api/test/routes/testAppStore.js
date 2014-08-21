"use strict";

var appStore = require("../../routes/appStore.js");
var fs = require('fs');

exports.group = {
    setUp: function(callback) {
        callback();
    },

    tearDown: function(callback) {
        callback();
    },

    testGetPageSrc: function(test) {
        test.done();
        return; //ignore test

        appStore.getPageSrc('284910350', function(err, pageSrc) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(pageSrc.indexOf("Yelp") !== -1, "Page source does not contain expected content");
            test.done();
        });
    },

    testParseSrc: function(test) {
        fs.readFile('test/routes/files/AppStoreSrc.html', 'utf8', function(err, data) {
            test.expect(3);
            test.ok(err === null, err);

            appStore.parseHtml(data, function(err, result) {
                test.ok(err === null, err);
                test.equals(result.title, "Yelp");
                test.done();
            });
        });
    },

    testLookup: function(test) {
        test.done();
        return; //ignore test

        appStore.getLookup('284910350', function(err, result) {
            test.expect(2);
            test.ok(err === null, err);
            test.equals(result.results[0].trackName, "Yelp");
            test.done();
        });
    },

    testParseLookup: function(test) {
        fs.readFile('test/routes/files/AppStoreLookup.json', 'utf8', function(err, data) {
            test.expect(3);
            test.ok(err === null, err);

            appStore.parseLookup(JSON.parse(data).results[0], function(err, result) {
                test.ok(err === null, err);
                test.equals(result.name, "Yelp");
                test.done();
            });
        });
    },

    testRetrieveApp: function(test) {
        test.done();
        return; //ignore test
        
        appStore.retrieveApp('284910350', function(err, itemId) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(itemId > 0, "Item not inserted");
            test.done();
        });
    }
};
