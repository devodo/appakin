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

var search = function(queryStr, pageNum, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialChars(queryStr));
    var solrQuery = 'rows=' + PAGE_SIZE + '&qq=' + q + '&spellcheck.q=' + q;

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
                name: doc.name,
                url: urlUtil.makeUrl(doc.url, doc.name),
                imageUrl: doc.img_url,
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





