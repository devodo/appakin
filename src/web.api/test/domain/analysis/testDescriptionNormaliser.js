'use strict';

var proc = require('../../../domain/analysis/descriptionNormaliser');

var nlpCompromise = require('nlp_compromise');





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
        test.strictEqual(description.getResult(), 'This is a description. This is the second line.\n\n');
        test.done();
    },

    testDivider: function (test) {
        var appDescription = 'This is a description.\n******\nThis is the second line.';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), 'This is a description.\n\nThis is the second line.\n\n');
        test.done();
    },

    testBulletList: function (test) {
        var appDescription = 'This is a description.\n* bullet one\n*  bullet two';
        var description = proc.createNormalisedDescription(appDescription);
        test.strictEqual(description.getResult(), 'This is a description.\n* bullet one\n* bullet two\n\n');
        test.done();
    },

    testFoo: function (test) {
        var result = nlpCompromise.tokenize('This is a sentence. This is another.');

        var parsedSentences = sentence_parser('How are you!?! That iss great.');

        test.strictEqual(result[0].tokens.length, 4);
        test.strictEqual(parsedSentences.length, 2);
        test.done();
    }
};

