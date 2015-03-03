'use strict';

var Paragraph = require('../../../domain/analysis/model/paragraph').Paragraph;
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

    testForEachSentence: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        var resultSentences = [];

        paragraph.forEachSentence(true, function(line) {
            resultSentences.push(line);
        });

        test.equal(resultSentences.length, 2);
        test.done();
    },

    testForEachActiveList: function (test) {
        var paragraph = new Paragraph([
            new List([
                new ListItem([]),
                new ListItem([])
            ]),
            new List([
                new ListItem([]),
                new ListItem([])
            ])
        ]);

        var resultLists = [];

        paragraph.forEachActiveList(function(list) {
            resultLists.push(list);
        });

        test.strictEqual(resultLists.length, 2);
        test.done();
    },

    testForEachActiveListWhenParagraphIsRemoved: function (test) {
        var paragraph = new Paragraph([
            new List([
                new ListItem([]),
                new ListItem([])
            ]),
            new List([
                new ListItem([]),
                new ListItem([])
            ])
        ]);

        paragraph.markAsRemoved();
        var resultLists = [];

        paragraph.forEachActiveList(function(list) {
            resultLists.push(list);
        });

        test.strictEqual(resultLists.length, 0);
        test.done();
    },

    testForEachActiveListWhenOneListIsRemoved: function (test) {
        var removedList = new List([
            new ListItem([]),
            new ListItem([])
        ]);

        removedList.markAsRemoved();

        var paragraph = new Paragraph([
            removedList,
            new List([
                new ListItem([]),
                new ListItem([])
            ])
        ]);

        var resultLists = [];

        paragraph.forEachActiveList(function(list) {
            resultLists.push(list);
        });

        test.strictEqual(resultLists.length, 1);
        test.done();
    },

    testGetElement: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        test.notStrictEqual(paragraph.getElement(0), null);
        test.strictEqual(paragraph.getElement(1), null);
        test.done();
    },

    testGetResult: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        test.strictEqual(paragraph.getResult(), 'aaa bbb\n\n');
        test.done();
    },

    testGetResultWhenParagraphIsRemoved: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        paragraph.isRemoved = true;

        test.strictEqual(paragraph.getResult(), '');
        test.done();
    },

    testGetRemovedResult: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        test.strictEqual(paragraph.getRemovedResult(), '');
        test.done();
    },

    testGetRemovedResultWhenParagraphIsRemoved: function (test) {
        var paragraph = new Paragraph([
            new SentenceGroup([
                new Sentence('aaa'),
                new Sentence('bbb')
            ])
        ]);

        paragraph.isRemoved = true;

        test.strictEqual(paragraph.getRemovedResult(), 'aaa bbb\n\n');
        test.done();
    },

    testSetStatistics: function (test) {
        var sentenceA = new Sentence('aaa b c');
        var sentenceB = new Sentence('bbb');

        var paragraph = new Paragraph([
            new SentenceGroup([sentenceA, sentenceB])
        ]);

        var paragraphLength = paragraph.setStatistics(100, 20);
        test.strictEqual(paragraphLength, 10);
        test.strictEqual(sentenceA.lengthPercentageRelativeToParagraph, 70);
        test.strictEqual(sentenceB.lengthPercentageRelativeToParagraph, 30);
        test.strictEqual(paragraph.locationPercentageRelativeToDescription, 20);
        test.done();
    }
};
