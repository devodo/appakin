'use strict';

var st = require('../../../domain/analysis/similarityTest');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetResult: function (test) {
        test.strictEqual(st.isSimilar('Night Film Decoder', 'Night Film Decoder'), true, 1);
        test.strictEqual(st.isSimilar('Night Film Decoder for iPhone', 'Night Film Decoder'), true, 2);
        test.strictEqual(st.isSimilar('Night Film Decoder', 'Night Film Decoder for iPhone'), true, 3);
        test.strictEqual(st.isSimilar('Night Film Decoder Free', 'Night Film Decoder'), true, 4);
        test.strictEqual(st.isSimilar('Night Film Decoder', 'Night Film Decoder Free'), true, 5);
        test.strictEqual(st.isSimilar('May December Older', 'Night Film Decoder'), false, 6);
        test.strictEqual(st.isSimilar('Barbie', 'Night Film Decoder'), false, 7);
        test.strictEqual(st.isSimilar('Antelope Jackal for iPhone', 'Night Film Decoder'), false, 8);
        test.strictEqual(st.isSimilar('Antelope Jackal', 'Night Film Decoder for iPhone'), false, 9);
        test.strictEqual(st.isSimilar('Antelope Jackal FREE', 'Night Film Decoder'), false, 10);
        test.strictEqual(st.isSimilar('Antelope Jackal', 'Night Film Decoder FREE'), false, 11);
        test.strictEqual(st.isSimilar('Barbie', 'Savannah'), false, 12);
        test.strictEqual(st.isSimilar('Barbie', 'Seattle'), false, 13);
        test.strictEqual(st.isSimilar('Barbie', 'Vienna'), false, 14);
        test.strictEqual(st.isSimilar('Barbie', 'Bot Garage'), false, 15);
        test.strictEqual(st.isSimilar('Barbie', 'Barbie Color, Sparkle and Style!'), false, 16);
        test.done();
    }
};
