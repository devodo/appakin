'use strict';
var solrCore = require('./solrCore').getCategoryCore();

var PAGE_SIZE = 10;

var getHighlight = function(highlights, doc) {
    if (!highlights) { return null; }

    var hDoc = highlights[doc.id];
    if (!hDoc) { return null; }

    var hDesc = hDoc.desc_split;
    if (!hDesc || hDesc.length < 1) { return null; }

    return hDesc[0];
};

var getApps = function(expanded, doc) {
    var appSection = expanded[doc.id];
    if (!appSection) { return []; }

    var appDocs = appSection.docs;
    if (!appDocs) { return []; }

    return appDocs.map(function(appDoc) {
        return {
            name: appDoc.name,
            url: appDoc.url,
            imageUrl: appDoc.image_url
        };
    });
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
        var expanded = obj.expanded;

        var categories = obj.response.docs.map(function(doc) {

            var highlight = getHighlight(highlights, doc);
            var apps = getApps(expanded, doc);

            var category = {
                name: doc.name,
                url: doc.url,
                apps: apps
            };

            if (highlight) {
                category.highlight = highlight;
            }

            return category;
        });

        var suggestions = solrCore.getSuggestions(obj.spellcheck);

        var searhcResult = {
            total: obj.response.numFound,
            page: pageNum,
            categories: categories,
            suggestions: suggestions
        };

        next(null, searhcResult);
    });
};

exports.search = search;





