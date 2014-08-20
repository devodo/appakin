"use strict";

var appStore = require("../../routes/appStore.js");

exports.group = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    testGetPageSrc: function (test) {
        appStore.getPageSrc('id284910350', function(err, pageSrc) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(pageSrc.indexOf("Yelp") !== -1, "Page source does not contain expected content");
            test.done();
        });
    },
    test3: function (test) {
        test.done();

    }
};
