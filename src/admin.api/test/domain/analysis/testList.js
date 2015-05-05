'use strict';

var List = require('../../../domain/analysis/model/list').List;
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

    testForEachSentence: function(test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var list = new List([
            new ListItem(sentenceGroup, '-')
        ]);

        var resultSentences = [];

        list.forEachSentence(function(sentence) {
            resultSentences.push(sentence);
        });

        test.strictEqual(resultSentences.length, 2);
        test.done();
    },

    testForEachSentenceOnEarlyTermination: function(test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var list = new List([
            new ListItem(sentenceGroup, '-')
        ]);

        var resultSentences = [];

        list.forEachSentence(function(sentence) {
            resultSentences.push(sentence);
            return true;
        });

        test.strictEqual(resultSentences.length, 1);
        test.done();
    },

    testGetResult: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var list = new List([
            new ListItem(sentenceGroup, '-')
        ]);

        test.strictEqual(list.getResult(), '- foo bar\n');
        test.done();
    },

    testGetResultWhenListItemIsRemoved: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItems = [
            new ListItem(sentenceGroup, '-'),
            new ListItem(sentenceGroup, '*')
        ];

        listItems[0].markAsRemoved();
        var list = new List(listItems);

        test.strictEqual(list.getResult(), '* foo bar\n');
        test.done();
    },

    testGetResultWhenListIsRemoved: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var list = new List([
            new ListItem(sentenceGroup, '-')
        ]);

        list.markAsRemoved();

        test.strictEqual(list.getResult(), '');
        test.done();
    },

    testGetRemovedResult: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItems = [
            new ListItem(sentenceGroup, '-'),
            new ListItem(sentenceGroup, '*')
        ];

        var list = new List(listItems);

        test.strictEqual(list.getRemovedResult(), '');
        test.done();
    },

    testGetRemovedResultWhenListItemIsRemoved: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItems = [
            new ListItem(sentenceGroup, '-'),
            new ListItem(sentenceGroup, '*')
        ];

        listItems[0].markAsRemoved();
        var list = new List(listItems);

        test.strictEqual(list.getRemovedResult(false), '- foo bar\n')
        test.done();
    },

    testGetRemovedResultWhenListItemIsRemovedAndForced: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var listItems = [
            new ListItem(sentenceGroup, '-'),
            new ListItem(sentenceGroup, '*')
        ];

        listItems[0].markAsRemoved();
        var list = new List(listItems);

        test.strictEqual(list.getRemovedResult(true), '- foo bar\n* foo bar\n')
        test.done();
    },

    testGetRemovedResultWhenListIsRemoved: function (test) {
        var sentenceGroup = new SentenceGroup([
            new Sentence('foo'),
            new Sentence('bar')
        ]);

        var list = new List([
            new ListItem(sentenceGroup, '-')
        ]);

        list.markAsRemoved();

        test.strictEqual(list.getRemovedResult(), '- foo bar\n')
        test.done();
    }
};
