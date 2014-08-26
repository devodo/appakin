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
        xyoData.crawl(10, function(err, results) {
            test.expect(1);
            test.ok(err === null, err);
            test.done();
        });
    }
};