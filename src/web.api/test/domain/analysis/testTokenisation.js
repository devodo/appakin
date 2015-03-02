'use strict';

var tokenisation = require('../../../domain/analysis/tokenisation');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testTokenise: function (test) {
        var result = tokenisation.tokenise('foo bar.');
        test.strictEqual(result.length, 2);
        test.done();
    },

    testTokeniseOnMultipleSentenceInput: function (test) {
        var result = tokenisation.tokenise('Foo bar. Bar bar.');
        test.strictEqual(result.length, 4);
        test.done();
    },

    testTokeniseOnQuotes: function (test) {
        var result = tokenisation.tokenise('"Monkey see, monkey do."');
        test.strictEqual(result.length, 4);
        test.done();
    },

    testCreateStringFromTokens: function (test) {
        var tokens = tokenisation.tokenise('Cat in a Hat.');
        var result = tokenisation.createStringFromTokens(tokens, 10);
        test.strictEqual(result, "cat in a hat");
        test.done();
    },

    testCreateStringFromTokensWhenNoTokenCountGiven: function (test) {
        var tokens = tokenisation.tokenise('Cat in a Hat.');
        var result = tokenisation.createStringFromTokens(tokens);
        test.strictEqual(result, "cat in a hat");
        test.done();
    },

    testCreateStringFromTokensWhenTokenCountIsRestricted: function (test) {
        var tokens = tokenisation.tokenise('Cat in a Hat.');
        var result = tokenisation.createStringFromTokens(tokens, 2);
        test.strictEqual(result, "cat in");
        test.done();
    }
};