"use strict";

var appakinRepo = require("../../repos/appakinRepo.js");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testArray: function (test) {
        appakinRepo.testArray(function(err, result) {
            test.expect(2);
            test.ok(err === null, err);
            test.ok(result > 0);
            appakinRepo.end();
            test.done();
        });
    }
};
