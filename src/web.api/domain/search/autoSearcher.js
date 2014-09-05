'use strict';
var solr = require('solr-client');
var async = require('async');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var PAGE_SIZE = 6;
var EDGE_THRESHOLD = 10;

function escapeSpecialChars(s){
    return s.replace(/([\+\-&\|!\(\)\{\}\[\]\^"~\*\?:\\])/g, function(match) {
        return '\\' + match;
    });
}

var search = function(queryStr, pageNum, next) {
    var queryLength = queryStr.length;
    var useLong = queryLength >= EDGE_THRESHOLD;

    var q = escapeSpecialChars(queryStr);
    if (useLong) {
        q = q + '*';
    }

    var query = solrCore.client.createQuery();
    query.q(q);
    query.rows(PAGE_SIZE);

    if (pageNum && pageNum > 1) {
        query.start((pageNum - 1) * PAGE_SIZE);
    }

    var requestHandler = useLong ? 'custom_long' : 'custom';

    solrCore.client.get(requestHandler, query, function (err, obj) {
        if (err) {
            return next(err);
        }

        next(null, obj.response);
    });
};

exports.search = search;





