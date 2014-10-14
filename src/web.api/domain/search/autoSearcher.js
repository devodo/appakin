'use strict';
var solrCore = require('./solrCore').getAutoSolrCore();

var PAGE_SIZE = 6;
var EDGE_THRESHOLD = 10;

var search = function(queryStr, pageNum, next) {
    queryStr = solrCore.preProcessIndexText(queryStr);
    var queryLength = queryStr.length;
    var useLong = queryLength >= EDGE_THRESHOLD;

    var q = solrCore.escapeSpecialChars(queryStr);
    var solrQuery = 'rows=' + PAGE_SIZE + '&qq=' + encodeURIComponent(q);

    var requestHandler = useLong ? 'custom_long' : 'custom_long';

    solrCore.client.get(requestHandler, solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        var suggestions = obj.response.docs.map(function(doc) {
            return doc.name_display;
        });

        var searhcResult = {
            suggestions: suggestions
        };

        next(null, searhcResult);
    });
};

exports.search = search;





