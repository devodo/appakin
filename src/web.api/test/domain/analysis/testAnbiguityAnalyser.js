"use strict";

var ambiguityAnalyser = require('../../../domain/analysis/ambiguityAnalyser');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testStrip: function (test) {
        var input = "this is a normal string";
        var output = "this is a normal string";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testStrip2: function (test) {
        var input = "This is a normal string";
        var output = "this is a normal string";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testStrip3: function (test) {
        var input = "Download free app";
        var output = "download";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testStrip4: function (test) {
        var input = "Free angry birds HD";
        var output = "angry birds";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testStrip5: function (test) {
        var input = "the free app";
        var output = "the free app";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testStrip6: function (test) {
        var input = "Alice for the iPad-Lite";
        var output = "alice";
        var result = ambiguityAnalyser.stripIgnoreTerms(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    },

    testAnalysis: function(test) {
        var input = "A.B.C Mix Up - Do You Know Your Alphabet?";
        var output = "alice";
        var result = ambiguityAnalyser.getStrippedAnalysis(input);
        test.expect(1);
        test.equal(result, output);
        test.done();
    }
};
