'use strict';

var Paragraph = require('../../../domain/analysis/model/paragraph').Paragraph;
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

    //testForEachActiveElement: function (test) {
    //    var lines = [
    //        new Line('aaa'),
    //        new Line('bbb')
    //    ];
    //
    //    lines[0].markAsRemoved();
    //
    //    var paragraph = new Paragraph(lines);
    //    var resultLines = [];
    //
    //    paragraph.forEachActiveElement(true, function(line) {
    //        resultLines.push(line);
    //    });
    //
    //    test.equal(resultLines.length, 1);
    //    test.done();
    //},

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
    }
};
