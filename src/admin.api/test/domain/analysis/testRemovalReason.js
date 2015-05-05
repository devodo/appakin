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
        removalReason.add('foo', 1);
        test.strictEqual(removalReason.getAttributeText(), ' title="foo"');
        test.strictEqual(removalReason.soundness, 1);
        test.done();
    },

    testGetAttributeTextWithTwoReasons: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo', 3);
        removalReason.add('bar', 1);
        test.strictEqual(removalReason.getAttributeText(), ' title="foo, bar"');
        test.strictEqual(removalReason.soundness, 3);
        test.done();
    },

    testGetInlineText: function(test) {
        var removalReason = new RemovalReason();
        test.strictEqual(removalReason.getInlineText(), '');
        test.done();
    },

    testGetInlineTextWithOneReason: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo', 1);
        test.strictEqual(removalReason.getInlineText(), '[[foo]] ');
        test.done();
    },

    testGetInlineTextWithTwoReasons: function(test) {
        var removalReason = new RemovalReason();
        removalReason.add('foo', 1);
        removalReason.add('bar', 3);
        test.strictEqual(removalReason.getInlineText(), '[[foo, bar]] ');
        test.strictEqual(removalReason.soundness, 3);
        test.done();
    }
};
