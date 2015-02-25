'use strict';

var dm = require('../../../domain/analysis/descriptionModel');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testForEachActiveParagraph: function (test) {
        var paragraphs = [
            dm.CreateParagraph([dm.CreateLine('foo')], false)
        ];

        var description = dm.CreateDescription(paragraphs);
        var resultParagraphs = [];

        description.forEachActiveParagraph(function(paragraph) {
            resultParagraphs.push(paragraph);
        });

        test.strictEqual(resultParagraphs.length, 1);
        test.done();
    },

    testForEachActiveParagraphWhenParagraphIsRemoved: function (test) {
        var paragraphs = [
            dm.CreateParagraph([dm.CreateLine('foo')], false)
        ];

        paragraphs[0].isRemoved = true;
        var description = dm.CreateDescription(paragraphs);
        var resultParagraphs = [];

        description.forEachActiveParagraph(function(paragraph) {
            resultParagraphs.push(paragraph);
        });

        test.strictEqual(resultParagraphs.length, 0);
        test.done();
    },

    testGetResult: function (test) {
        var paragraphs = [
            dm.CreateParagraph([dm.CreateLine('foo')], false)
        ];

        var description = dm.CreateDescription(paragraphs);

        test.strictEqual(description.getResult(), 'foo ');
        test.done();
    },

    testGetResultWhenParagraphIsNotActive: function (test) {
        var paragraphs = [
            dm.CreateParagraph([dm.CreateLine('foo')], false)
        ];

        paragraphs[0].isRemoved = true;
        var description = dm.CreateDescription(paragraphs);

        test.strictEqual(description.getResult(), '');
        test.done();
    }
};