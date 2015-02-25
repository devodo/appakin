'use strict';

var dm = require('../../../domain/analysis/descriptionModel');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testForEachLine: function (test) {
        var paragraph = new dm.CreateParagraph([
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ], false);

        var resultLines = [];

        paragraph.forEachLine(true, function(line) {
            resultLines.push(line);
        });

        test.equal(resultLines.length, 2);
        test.done();
    },

    testForEachLineWhenIgnoringListItems: function (test) {
        var paragraph = new dm.CreateParagraph([
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ], false);

        var resultLines = [];

        paragraph.forEachLine(false, function(line) {
            resultLines.push(line);
        });

        test.equal(resultLines.length, 1);
        test.done();
    },

    testForEachActiveLine: function (test) {
        var lines = [
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ];

        lines[0].markAsRemoved();

        var paragraph = new dm.CreateParagraph(lines, false);
        var resultLines = [];

        paragraph.forEachActiveLine(true, function(line) {
            resultLines.push(line);
        });

        test.equal(resultLines.length, 1);
        test.done();
    },

    testForEachActiveLineWhenIgnoringListItems: function (test) {
        var lines = [
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ];

        lines[0].markAsRemoved();

        var paragraph = new dm.CreateParagraph(lines, false);
        var resultLines = [];

        paragraph.forEachActiveLine(false, function(line) {
            resultLines.push(line);
        });

        test.equal(resultLines.length, 0);
        test.done();
    },

    testGetLine: function (test) {
        var lines = [
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ];

        var paragraph = new dm.CreateParagraph(lines, false);

        test.notStrictEqual(paragraph.getLine(0), null);
        test.notStrictEqual(paragraph.getLine(1), null);
        test.strictEqual(paragraph.getLine(2), null);
        test.done();
    },

    testGetResult: function (test) {
        var lines = [
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ];

        var paragraph = new dm.CreateParagraph(lines, false);

        test.strictEqual(paragraph.getResult(), 'aaa - bbb ');
        test.done();
    },

    testGetResultWhenParagraphIsRemoved: function (test) {
        var lines = [
            dm.CreateLine('aaa'),
            dm.CreateLine('bbb', true, '-')
        ];

        var paragraph = new dm.CreateParagraph(lines, false);
        paragraph.isRemoved = true;

        test.strictEqual(paragraph.getResult(), '');
        test.done();
    }
};
