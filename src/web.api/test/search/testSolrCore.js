"use strict";

var solrCore = require("../../domain/search/solrCore");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetTopText: function (test) {
        var catCore = solrCore.getCategoryCore();
        var text = "The quick brown fox jumps over the lazy dog";
        var posi = "1234567890123456789012345678901234567890123";

        var r1 = catCore.getTopWords(text, 10);
        var r2 = catCore.getTopWords(text, 0);
        var r3 = catCore.getTopWords(text, 1000);
        var r4 = catCore.getTopWords(posi, 10);
        var r5 = catCore.getTopWords(text, 23);
        var r6 = catCore.getTopWords(text, 9);
        test.expect(6);
        test.equals(r1, "The quick");
        test.equals(r2, "");
        test.equals(r3, text);
        test.equals(r4, "");
        test.equals(r5, "The quick brown fox");
        test.equals(r6, "The quick");
        test.done();
    }
};
