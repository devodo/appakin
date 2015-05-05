'use strict';

var ListItem = require('../../../domain/analysis/model/listItem').ListItem;
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

        var listItem = new ListItem(sentenceGroup, '*');

        test.equal(listItem.getResult(), '* foo bar\n');
        test.done();
    },

    testGetResultWhenAllSentencesAreRemoved: function (test) {
        var sentences = [
            new Sentence('foo')
        ];

        sentences[0].markAsRemoved();
        var sentenceGroup = new SentenceGroup(sentences);
        var listItem = new ListItem(sentenceGroup, '*');

        test.equal(listItem.getResult(), '');
        test.done();
    },

    testGetResultWhenListItemIsRemoved: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo')
        ]);

        var listItem = new ListItem(sentenceGroup, '*');
        listItem.markAsRemoved();

        test.equal(listItem.getResult(), '');
        test.done();
    },

    testGetRemovedResult: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItem = new ListItem(sentenceGroup, '*');

        test.equal(listItem.getRemovedResult(), '');
        test.done();
    },

    testGetRemovedResultWhenSentenceIsRemoved: function (test) {
        var sentences = [
            new Sentence('foo'),
            new Sentence('bar')
        ];

        sentences[0].markAsRemoved();
        var sentenceGroup = new SentenceGroup(sentences);
        var listItem = new ListItem(sentenceGroup, '*');

        test.equal(listItem.getRemovedResult(false), '* foo\n');
        test.done();
    },

    testGetRemovedResultWhenSentenceIsRemovedAndIsForced: function (test) {
        var sentences = [
            new Sentence('foo'),
            new Sentence('bar')
        ];

        sentences[0].markAsRemoved();
        var sentenceGroup = new SentenceGroup(sentences);
        var listItem = new ListItem(sentenceGroup, '*');

        test.equal(listItem.getRemovedResult(true), '* foo bar\n');
        test.done();
    },

    testForEachSentence: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItem = new ListItem(sentenceGroup, '*');
        var resultSentences = [];

        listItem.forEachSentence(function(sentence) {
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

        var listItem = new ListItem(sentenceGroup, '*');
        var resultSentences = [];

        listItem.forEachSentence(function(sentence) {
            resultSentences.push(sentence);
            return true;
        });

        test.strictEqual(resultSentences.length, 1);
        test.done();
    }
};