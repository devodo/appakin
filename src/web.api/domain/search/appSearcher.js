'use strict';
var solrCore = require('./solrCore').getAppSolrCore();
var urlUtil = require('../urlUtil');

var PAGE_SIZE = 10;

var getHighlight = function(highlights, docId) {
    if (!highlights) { return null; }

    var hDoc = highlights[docId];
    if (!hDoc) { return null; }

    if (!hDoc.desc_split && !hDoc.name_split) { return null; }

    if (hDoc.name_split) {
        hDoc.name = hDoc.name_split;
        delete hDoc.name_split;
    }

    if (hDoc.desc_split) {
        hDoc.desc = hDoc.desc_split;
        delete hDoc.desc_split;
    }

    return hDoc;
};

var buildFilterQuery = function(filters) {
    var filterQuery = '&filter=';

    if (filters.isIphone === true) {
        filterQuery += '+is_iphone:true';
    } else if (filters.isIpad === true) {
        filterQuery += '+is_ipad:true';
    }

    if (filters.isFree === true) {
        filterQuery += '+is_free:true';
    }

    return filterQuery;
};

var search = function(queryStr, pageNum, filters, next) {
    var q = encodeURIComponent(solrCore.escapeSolrParserChars(queryStr));
    var filter = buildFilterQuery(filters);
    var solrQuery = 'rows=' + PAGE_SIZE + '&qq=' + q + '&spellcheck.q=' + q + filter;

    if (pageNum && pageNum > 1) {
        var start = (pageNum - 1) * PAGE_SIZE;
        solrQuery += '&start=' + start;
    }

    solrCore.client.get('custom', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var highlights = obj.highlighting;

        var apps = obj.response.docs.map(function(doc) {

            var highlight = getHighlight(highlights, doc.id);

            var app = {
                id: doc.id,
                name: doc.name_split,
                url: urlUtil.makeUrl(doc.id, doc.name_split),
                imageUrl: doc.img_url,
                price: doc.price,
                popularity: doc.popularity
            };

            if (highlight) {
                app.highlight = highlight;
            }

            return app;
        });

        var suggestions = solrCore.getSuggestions(obj.spellcheck);

        var searhcResult = {
            total: obj.response.numFound,
            page: pageNum,
            apps: apps,
            suggestions: suggestions
        };

        next(null, searhcResult);
    });
};

exports.search = search;





