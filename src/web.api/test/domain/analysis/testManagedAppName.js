'use strict';

var managedAppName = require('../../../domain/analysis/model/managedAppName');
var Sentence = require('../../../domain/analysis/model/sentence').Sentence;
var createManagedAppName = managedAppName.createManagedAppName;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testCreateManagedAppName2: function (test) {
        doTestCreateManagedAppName('Cut the Rope by Zymba (Free)', 'Zymba', 'cut the rope by zymba', 'cut the rope', test);
        doTestCreateManagedAppName('Cut the Rope - Interesting - That', 'Zymba', 'cut the rope', 'cut the rope', test);
        test.done();
    },

    testCreateManagedAppName: function (test) {
        var result = createManagedAppName('Cut the Rope by Zymba (Free)', 'Zymba');
        test.strictEqual(result.originalAppName, 'Cut the Rope by Zymba (Free)');
        test.strictEqual(result.compactAppName, 'Cut the Rope by Zymba');
        test.strictEqual(result.compactAppNameTokens.length, 5);
        test.strictEqual(result.compactAppNameRemade, 'cut the rope by zymba');
        test.strictEqual(result.noDeveloperCompactAppName, 'Cut the Rope');
        test.strictEqual(result.noDeveloperCompactAppNameTokens.length, 3);
        test.strictEqual(result.noDeveloperCompactAppNameRemade, 'cut the rope');
        test.done();
    },

    testCreateManagedAppNameWithTitle: function (test) {
        var result = createManagedAppName('Cut the Rope: Interesting', 'Zymba');
        test.strictEqual(result.originalAppName, 'Cut the Rope: Interesting');
        test.strictEqual(result.compactAppName, 'Cut the Rope');
        test.strictEqual(result.compactAppNameTokens.length, 3);
        test.strictEqual(result.compactAppNameRemade, 'cut the rope');
        test.strictEqual(result.noDeveloperCompactAppName, 'Cut the Rope');
        test.strictEqual(result.noDeveloperCompactAppNameTokens.length, 3);
        test.strictEqual(result.noDeveloperCompactAppNameRemade, 'cut the rope');
        test.done();
    },

    testCreateManagedAppNameWithTitle2: function (test) {
        var result = createManagedAppName('Cut the Rope - Interesting - That', 'Zymba');
        test.strictEqual(result.originalAppName, 'Cut the Rope - Interesting - That');
        test.strictEqual(result.compactAppName, 'Cut the Rope');
        test.strictEqual(result.noDeveloperCompactAppName, 'Cut the Rope');
        test.done();
    },

    // TODO more createManagedAppName tests.

    testIsSimilarTo: function (test) {
        var a = createManagedAppName('Cut the Rope', 'Zymba');
        var b = createManagedAppName('Cat the Rope', 'Zymba');
        test.strictEqual(a.isSimilarTo(b), true);
        test.done();
    },

    testIsSimilarToWhenNotSimilar: function (test) {
        var a = createManagedAppName('Cut the Rope', 'Zymba');
        var b = createManagedAppName('Angel Wings', 'Zymba');
        test.strictEqual(a.isSimilarTo(b), false);
        test.done();
    },
    // TODO more isSimilarTo tests.

    testMatches: function (test) {
        var sentence = new Sentence('Cuts the Rope is our latest app that you might like!');
        var managedAppName = createManagedAppName('Cut the Rope', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), true);
        test.done();
    },

    testMatches2: function (test) {
        var sentence = new Sentence('Make a Wave is our latest app that you might like!');
        var managedAppName = createManagedAppName('Make a Wave', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), true);
        test.done();
    },

    testMatchesWhenDoesNotMatch: function (test) {
        var sentence = new Sentence('Hamster is our latest app that you might like!');
        var managedAppName = createManagedAppName('Cut the Rope', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), false);
        test.done();
    }
    // TODO add more matches tests.
};

function doTestCreateManagedAppName(appName, developerName, expectedCompactAppNameRemade, expectedNoDeveloperCompactAppNameRemade, test) {
    var result = createManagedAppName(appName, developerName);
    test.strictEqual(result.compactAppNameRemade, expectedCompactAppNameRemade, 'Compact name for ' + appName + '/' + developerName);
    test.strictEqual(result.noDeveloperCompactAppNameRemade, expectedNoDeveloperCompactAppNameRemade, 'Compact Dev name for ' + appName + '/' + developerName);
}
