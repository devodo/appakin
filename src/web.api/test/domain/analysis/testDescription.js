'use strict';

var Description = require('../../../domain/analysis/model/description').Description;
var Paragraph = require('../../../domain/analysis/model/paragraph').Paragraph;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testForEachActiveParagraph: function (test) {
        var paragraphs = [
            new Paragraph([])
        ];

        var description = new Description(paragraphs);
        var resultParagraphs = [];

        description.forEachActiveParagraph(function(paragraph) {
            resultParagraphs.push(paragraph);
        });

        test.strictEqual(resultParagraphs.length, 1);
        test.done();
    },

    testForEachActiveParagraphWhenParagraphIsRemoved: function (test) {
        var paragraphs = [
            new Paragraph([])
        ];

        paragraphs[0].isRemoved = true;
        var description = new Description(paragraphs);
        var resultParagraphs = [];

        description.forEachActiveParagraph(function(paragraph) {
            resultParagraphs.push(paragraph);
        });

        test.strictEqual(resultParagraphs.length, 0);
        test.done();
    }
};