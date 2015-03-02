'use strict';

var RemovalReason = require('../../../domain/analysis/model/removalReason').RemovalReason;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetAttributeText: function(test) {
        var removalReason = new RemovalReason();
        test.strictEqual(removalReason.getAttributeText(), '');
        test.done();
    },

    testGetAttributeTextWithOneReason: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo');
        test.strictEqual(removalReason.getAttributeText(), ' title="foo"');
        test.done();
    },

    testGetAttributeTextWithTwoReasons: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo');
        removalReason.add('bar');
        test.strictEqual(removalReason.getAttributeText(), ' title="foo, bar"');
        test.done();
    },

    testGetInlineText: function(test) {
        var removalReason = new RemovalReason();
        test.strictEqual(removalReason.getInlineText(), '');
        test.done();
    },

    testGetInlineTextWithOneReason: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo');
        test.strictEqual(removalReason.getInlineText(), '[[foo]] ');
        test.done();
    },

    testGetInlineTextWithTwoReasons: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo');
        removalReason.add('bar');
        test.strictEqual(removalReason.getInlineText(), '[[foo, bar]] ');
        test.done();
    }
};
