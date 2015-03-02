'use strict';

var similarity = require('../../../domain/analysis/similarity');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testSimilar: function (test) {
        test.strictEqual(similarity.similar('Night Film Decoder', 'Night Film Decoder'), true, 1);
        test.strictEqual(similarity.similar('Night Film Decoder for iPhone', 'Night Film Decoder'), true, 2);
        test.strictEqual(similarity.similar('Night Film Decoder', 'Night Film Decoder for iPhone'), true, 3);
        test.strictEqual(similarity.similar('Night Film Decoder Free', 'Night Film Decoder'), true, 4);
        test.strictEqual(similarity.similar('Night Film Decoder', 'Night Film Decoder Free'), true, 5);
        test.strictEqual(similarity.similar('May December Older', 'Night Film Decoder'), false, 6);
        test.strictEqual(similarity.similar('Barbie', 'Night Film Decoder'), false, 7);
        test.strictEqual(similarity.similar('Antelope Jackal for iPhone', 'Night Film Decoder'), false, 8);
        test.strictEqual(similarity.similar('Antelope Jackal', 'Night Film Decoder for iPhone'), false, 9);
        test.strictEqual(similarity.similar('Antelope Jackal FREE', 'Night Film Decoder'), false, 10);
        test.strictEqual(similarity.similar('Antelope Jackal', 'Night Film Decoder FREE'), false, 11);
        test.strictEqual(similarity.similar('Barbie', 'Savannah'), false, 12);
        test.strictEqual(similarity.similar('Barbie', 'Seattle'), false, 13);
        test.strictEqual(similarity.similar('Barbie', 'Vienna'), false, 14);
        test.strictEqual(similarity.similar('Barbie', 'Bot Garage'), false, 15);
        test.strictEqual(similarity.similar('Barbie', 'Barbie Color, Sparkle and Style!'), false, 16);
        test.done();
    },

    testGetResultOnHighMatchList: function (test) {
        var sameDeveloperAppNames = [
                "American Revolution",
                "Ancient Egypt",
                "Ancient Greece",
                "Cells",
                "Constitution",
                "Energy",
                "Geology",
                "SPACE",
                "Matter",
                "Roman Empire",
                "Electricity",
                "Incas",
                "Plants",
                "Space Race Card Match",
                "Atoms",
                "Civil War",
                "Extreme Weather",
                "Simple Machines",
                "Sun",
                "Washington D.C.",
                "Ecology",
                "Galaxies",
                "Geography"
            ];

        var listOfApps = [
            'Ancient Greece', 'Ancient Egypt', 'Cells', 'Civil War', 'Constitution', 'Ecology', 'Extreme Weather',
            'Galaxies', 'Geography', 'Matter', 'Simple Machines', 'Space', 'Sun', 'Washington, D.C.',
            'Simple Machines', 'And More!'
            ];

        var matchCount = 0;

        for (var i = 0; i < listOfApps.length; ++i) {
            var appName = listOfApps[i];

            for (var j = 0; j < sameDeveloperAppNames.length; ++j) {
                var sameDeveloperAppName = sameDeveloperAppNames[j];

                if (similarity.similar(appName, sameDeveloperAppName)) {
                    ++matchCount;
                    break;
                }
            }
        }

        test.strictEqual(matchCount, 15);
        test.done();
    }
};
