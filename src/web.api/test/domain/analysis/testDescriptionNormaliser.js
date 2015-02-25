'use strict';

var proc = require('../../../domain/analysis/appDescriptionProcessor');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testEmptyDescription: function (test) {
        var appDescription = '';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), '');
        test.done();
    },

    testSingleParagraphDescription: function (test) {
        var appDescription = '   This is a description.      This is the second line.    ';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), 'This is a description. This is the second line. ');
        test.done();
    },

    testDivider: function (test) {
        var appDescription = 'This is a description.\n******\nThis is the second line.';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), 'This is a description. This is the second line. ');
        test.done();
    },

    testBulletList: function (test) {
        var appDescription = 'This is a description.\n* bullet one\n*  bullet two';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), 'This is a description. * bullet one * bullet two ');
        test.done();
    },

    testFoo: function (test) {
        // /([.?!])\s*(?=[A-Z])/

        var sentenceRegex = /([.?!])\s+(?=[A-Z])/g;

        var result = 'foo. Bar'.match(sentenceRegex);

        test.strictEqual(result, 'foo');
        test.done();
    }
};

