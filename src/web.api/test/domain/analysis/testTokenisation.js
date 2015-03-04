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

    testTokeniseOnTM: function (test) {
        var result = tokenisation.tokenise('"Monkey see, monkey™ do."');
        test.strictEqual(result.length, 4);
        test.done();
    },

    testTokeniseOnTM2: function (test) {
        var result = tokenisation.tokenise('"Monkey see , monkey™ do."');
        test.strictEqual(result.length, 4);
        test.done();
    },

    testCreateStringFromTokens: function (test) {
        doTestCreateStringFromTokens('Cat in a Hat.', null, 'cat in a hat', test);
        doTestCreateStringFromTokens('Cat in a Hat.', 2, 'cat', test);
        doTestCreateStringFromTokens('Cat in a Hat.', 5, 'cat in', test);
        doTestCreateStringFromTokens('Cat in a Hat.', 7, 'cat in a', test);
        doTestCreateStringFromTokens('Cat in a Hat.', 300, 'cat in a hat', test);
        test.done();
    }
};

function doTestCreateStringFromTokens(text, minLength, expected, test) {
    var tokens = tokenisation.tokenise(text);
    test.strictEqual(tokenisation.createStringFromTokens(tokens, minLength), expected);
}