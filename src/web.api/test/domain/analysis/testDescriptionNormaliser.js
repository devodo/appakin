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
        var description = proc.createNormalisedDescription(appDescription, 'appname', 'devname', []);
        test.strictEqual(description.getResult(), '');
        test.done();
    },

    testSingleParagraphDescription: function (test) {
        var appDescription = '   This is a description.      This is the second line.    ';
        var description = proc.createNormalisedDescription(appDescription, 'appname', 'devname', []);
        test.strictEqual(description.getResult(), 'This is a description. This is the second line.\n\n');
        test.done();
    },

    testDivider: function (test) {
        var appDescription = 'This is a description.\n******\nThis is the second line.';
        var description = proc.createNormalisedDescription(appDescription, 'appname', 'devname', []);
        test.strictEqual(description.getResult(), 'This is a description.\n\nThis is the second line.\n\n');
        test.done();
    },

    testBulletList: function (test) {
        var appDescription = 'This is a description.\n* bullet one\n*  (old) bullet two';
        var description = proc.createNormalisedDescription(appDescription, 'appname', 'devname', []);
        test.strictEqual(description.getResult(), 'This is a description.\n* bullet one\n* (old) bullet two\n\n');
        test.done();
    },

    testBulletListWithTwoListsInSuccession: function (test) {
        var appDescription = 'This is a description.\n* bullet one\n*  bullet two\n- hamster one\n- hamster 2';
        var description = proc.createNormalisedDescription(appDescription, 'appname', 'devname', []);
        test.strictEqual(description.paragraphs[0].elements.length, 3);
        test.strictEqual(description.getResult(), 'This is a description.\n* bullet one\n* bullet two\n- hamster one\n- hamster 2\n\n');
        test.done();
    }
};

