'use strict';
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
    queryStr = solrCore.preProcessIndexText(queryStr);
    var queryLength = queryStr.length;
    var useLong = queryLength >= EDGE_THRESHOLD;

    var q = escapeSpecialChars(queryStr);
    var solrQuery = 'qq=' + encodeURIComponent(q);

    var requestHandler = useLong ? 'custom_long' : 'custom';

    solrCore.client.get(requestHandler, solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        next(null, obj.response);
    });
};

exports.search = search;





