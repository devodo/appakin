'use strict';
var solrCore = require('./solrCore').getAppSolrCore();
var urlUtil = require('../urlUtil');

var PAGE_SIZE = 10;

var getHighlight = function(highlights, doc) {
    if (!highlights) { return null; }

    var hDoc = highlights[doc.id];
    if (!hDoc) { return null; }

    var hDesc = hDoc.desc_split;
    if (!hDesc || hDesc.length < 1) { return null; }

    return hDesc[0];
};

var search = function(queryStr, pageNum, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialChars(queryStr));
    var solrQuery = 'rows=' + PAGE_SIZE + '&q=' + q;

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

            var highlight = getHighlight(highlights, doc);

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





