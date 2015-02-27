'use strict';

var Sentence = require('../../../domain/analysis/model/sentence').Sentence;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetResult: function (test) {
        var sentence = new Sentence('foo bar');
        test.equal(sentence.getResult(), 'foo bar');
        test.done();
    },

    testGetResultWhenSentenceIsRemoved: function (test) {
        var sentence = new Sentence('foo bar');
        sentence.markAsRemoved();
        test.equal(sentence.getResult(), '');
        test.done();
    },

    testGetRemovedResult: function (test) {
        var sentence = new Sentence('foo bar');
        test.equal(sentence.getRemovedResult(), '');
        test.done();
    },

    testGetRemovedResultWhenSentenceIsRemoved: function (test) {
        var sentence = new Sentence('foo bar');
        sentence.markAsRemoved();
        test.equal(sentence.getRemovedResult(), 'foo bar');
        test.done();
    },

    testConditionallyMarkAsRemovedWhenNoMatch: function (test) {
        var sentence = new Sentence('cat in a hat');
        sentence.conditionallyMarkAsRemoved(/dog/);
        test.equal(sentence.getResult(), 'cat in a hat');
        test.done();
    },

    testConditionallyMarkAsRemovedWhenNoMatchAfterAMatch: function (test) {
        var sentence = new Sentence('cat in a hat');
        sentence.conditionallyMarkAsRemoved(/cat/);
        sentence.conditionallyMarkAsRemoved(/dog/);
        test.equal(sentence.getResult(), '');
        test.done();
    },

    testConditionallyMarkAsRemovedWhenMatch: function (test) {
        var sentence = new Sentence('cat in a hat');
        sentence.conditionallyMarkAsRemoved(/cat/);
        test.equal(sentence.getResult(), '');
        test.done();
    }
};