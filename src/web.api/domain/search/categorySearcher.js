'use strict';
var slug = require('slug');
var solrCore = require('./solrCore').getCategoryCore();
var urlUtil = require('../urlUtil');

var PAGE_SIZE = 10;

var getHighlight = function(highlights, doc) {
    if (!highlights) { return null; }

    var hDoc = highlights[doc.id];
    if (!hDoc) { return null; }

    var hDesc = hDoc.desc;
    if (!hDesc || hDesc.length < 1) { return null; }

    return hDesc;
};

var getApps = function(expanded, doc) {
    if (!expanded) { return []; }

    var appSection = expanded[doc.id];
    if (!appSection) { return []; }

    var appDocs = appSection.docs;
    if (!appDocs) { return []; }

    return appDocs.map(function(appDoc) {
        return {
            name: appDoc.name,
            url: urlUtil.makeUrl(appDoc.url, appDoc.name),
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
                url: urlUtil.makeUrl(doc.url, doc.name),
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





