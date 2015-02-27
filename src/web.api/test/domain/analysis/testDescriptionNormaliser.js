'use strict';

var proc = require('../../../domain/analysis/descriptionNormaliser');

var nlpCompromise = require('nlp_compromise');
var natural = require('natural');




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

        console.log(natural.JaroWinklerDistance("Zombie Tower Defence","Zombie Major Tower Defence"));
        console.log(natural.JaroWinklerDistance("Zombie Tower Defence","Zombie Defence"));
        console.log(natural.JaroWinklerDistance("Zombie Tower Defence"," Tower Defence Zombie Major"));
        console.log(natural.JaroWinklerDistance("Zombie Tower Defence","cosy beds"));
        console.log(natural.JaroWinklerDistance("Zombie Tower Defence"," beds"));

        // > 0.8, or > 0.9 for safety.
        console.log('----');

        console.log(natural.LevenshteinDistance("Zombie Tower Defence","Zombie Major Tower Defence"));
        console.log(natural.LevenshteinDistance("Zombie Tower Defence","Zombie Defence"));
        console.log(natural.LevenshteinDistance("Zombie Tower Defence"," Tower Defence Zombie Major"));
        console.log(natural.LevenshteinDistance("Zombie Tower Defence","cosy beds"));
        console.log(natural.LevenshteinDistance("Zombie Tower Defence"," beds"));
        // < 10

       // test.strictEqual(result[0].tokens.length, 2);
        test.done();
    }
};

