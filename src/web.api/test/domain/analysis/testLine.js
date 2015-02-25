'use strict';

var dm = require('../../../domain/analysis/descriptionModel');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetResult: function (test) {
        var line = dm.CreateLine('foo bar', false);
        test.equal(line.getResult(), 'foo bar ');
        test.done();
    },

    testGetResultWhenListIsListItem: function (test) {
        var line = dm.CreateLine('foo bar', true, '-');
        test.equal(line.getResult(), '- foo bar ');
        test.done();
    },

    testGetResultWhenLineIsRemoved: function (test) {
        var line = dm.CreateLine('foo bar', false);
        line.markAsRemoved();
        test.equal(line.getResult(), '');
        test.done();
    }
};