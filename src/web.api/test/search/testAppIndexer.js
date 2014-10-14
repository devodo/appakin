"use strict";

var appIndexer = require("../../domain/search/appIndexer");
var autoIndexer = require("../../domain/search/autoIndexer");

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    addAllApps: function (test) {
        return test.done(); // disable

        appIndexer.addAllApps(10000, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    rebuildAuto: function (test) {
        return test.done(); // disable

        autoIndexer.rebuild(10000, 6, function(err) {
            test.expect(1);
            test.ok(!err, err);
            test.done();
        });
    },

    testBuildNgramTree: function (test) {

        var testAppNames = [
            'Fudge Football',
            'Fudge Football 2',
            'Fudge Stacker',
            'Fudge Kitchen UK',
            'Fudge Brownie Dressup',
            'Fudge Hair Design Cardiff'
        ];

        var apps = testAppNames.map(function(name) {
            return { name: name };
        });

        var nGramTree = {
            maxCount: 0,
            children: {},
            childCount: 0
        };

        apps.forEach(function(app) {
            autoIndexer.buildNgramTree(app, nGramTree, 6);
        });

        var ngramNodes = autoIndexer.flattenNgramTree(nGramTree);

        test.expect(5);
        test.equals(nGramTree.maxCount, 5);
        test.ok(ngramNodes, 'ngramNodes is null');
        test.equals(ngramNodes[0].ngram, 'fudge');
        test.equals(ngramNodes[0].count, 6);
        test.equals(ngramNodes[0].childCount, 5);
        test.done();
    }
};
