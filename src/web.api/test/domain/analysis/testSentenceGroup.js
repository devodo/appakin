'use strict';

var SentenceGroup = require('../../../domain/analysis/model/sentenceGroup').SentenceGroup;
var Sentence = require('../../../domain/analysis/model/sentence').Sentence;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetResult: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        test.strictEqual(sentenceGroup.getResult(), 'foo bar\n');
        test.done();
    },

    testGetResultWhenSentenceIsRemoved: function (test) {
        var sentences = [
            new Sentence('foo'),
            new Sentence('bar')
        ];

        sentences[0].markAsRemoved();

        var sentenceGroup = new SentenceGroup(sentences);
        test.strictEqual(sentenceGroup.getResult(), 'bar\n');
        test.done();
    },

    testGetRemovedResult: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        test.strictEqual(sentenceGroup.getRemovedResult(), '');
        test.done();
    },

    testGetRemovedResultWhenSentenceIsRemoved: function (test) {
        var sentences = [
            new Sentence('foo'),
            new Sentence('bar')
        ];

        sentences[0].markAsRemoved();

        var sentenceGroup = new SentenceGroup(sentences);
        test.strictEqual(sentenceGroup.getRemovedResult(), 'foo\n');
        test.done();
    },

    testForEachSentence: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var resultSentences = [];

        sentenceGroup.forEachSentence(function(sentence) {
            resultSentences.push(sentence);
        });

        test.strictEqual(resultSentences.length, 2);
        test.done();
    },

    testForEachSentenceOnEarlyTermination: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var resultSentences = [];

        sentenceGroup.forEachSentence(function(sentence) {
            resultSentences.push(sentence);
            return true;
        });

        test.strictEqual(resultSentences.length, 1);
        test.done();
    }
};