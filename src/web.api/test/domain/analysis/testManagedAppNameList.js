'use strict';

var Sentence = require('../../../domain/analysis/model/sentence').Sentence;
var managedAppNameList = require('../../../domain/analysis/model/managedAppNameList');
var createManagedAppNameList = managedAppNameList.createManagedAppNameList;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testCreateManagedAppNameList: function (test) {
        var managedAppNameList = createManagedAppNameList('Cut the Rope', 'Zymba',
            ['Cut the Rope', 'Cut the Rope HD', 'Make a Wave']);

        test.strictEqual(managedAppNameList.managedAppNames.length, 1);
        test.done();
    },

    testCreateManagedAppNameListWhenNoOverlap: function (test) {
        var managedAppNameList = createManagedAppNameList('Cut the Rope', 'Zymba', ['Hold on', 'Make a Wave']);
        test.strictEqual(managedAppNameList.managedAppNames.length, 2);
        test.done();
    },

    testCreateManagedAppNameListWhenNoRelatedApps: function (test) {
        var managedAppNameList = createManagedAppNameList('Cut the Rope', 'Zymba', []);
        test.strictEqual(managedAppNameList.managedAppNames.length, 0);
        test.done();
    },
    // TODO more createManagedAppNameList tests.

    testMatches: function (test) {
        var sentence = new Sentence('Make a Wave is our latest app that you might like!');
        var managedAppNameList = createManagedAppNameList('Cut the Rope', 'Zymba', ['Hold on', 'Make a Wave']);
        test.strictEqual(managedAppNameList.matches(sentence), true);
        test.done();
    },

    testMatchesWhenNoMatch: function (test) {
        var sentence = new Sentence('Make a Wave is our latest app that you might like!');
        var managedAppNameList = createManagedAppNameList('Cut the Rope', 'Zymba', ['Hold on', 'Cut the Rope']);
        test.strictEqual(managedAppNameList.matches(sentence), false);
        test.done();
    }
};
