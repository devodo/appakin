'use strict';

var fs = require('fs');
var async = require('async');
var solrClusterCore = require('../search/solrCore').getClusterCore();
var config = require('../../config');
var log = require('../../logger');

var parseTermStats = function(fieldArray) {
    var termStats = {
        terms: []
    };

    var termsToExclude = /[0-9.@]/;
    var numStems = fieldArray && fieldArray.length ? fieldArray.length / 2 : 0;
    var totalValidTerms = 0;

    for (var i = 0; i < numStems; i++) {
        var indexBase = i * 2;
        var term = fieldArray[indexBase];

        // ignore shingled terms
        if (term.split(' ') > 1) {
            continue;
        }

        // ignore any term with a digit in it or that is not long enough
        if (term.length < 3 || termsToExclude.test(term)) {
            continue;
        }

        var stats = fieldArray[indexBase + 1];

        termStats.terms.push({
            term: term,
            termFreq: stats[1]
        });

        totalValidTerms += stats[1];
    }

    termStats.totalValidTerms = totalValidTerms;

    return termStats;
};

var getDescriptionStats = function(appId, next) {
    var solrQuery = 'q=' + appId.replace(/\-/g, '') + '&tv.fl=desc';

    solrClusterCore.client.get('keyword', solrQuery, function (err, obj) {
        if (err) { return next(err); }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var stats = null;

        if (!obj.docs || !obj.docs[3]) {
            log.debug('Failed to get term vectors for app ' + appId);

            stats = {
                totalValidTerms: 0,
                terms: []
            };
        } else {
            stats = parseTermStats(obj.docs[3][3]);
        }

        next(null, stats);
    });
};

exports.getDescriptionStats = getDescriptionStats;
