'use strict';
var slug = require('slug');
var solrCore = require('./solrCore').getCategoryCore();
var urlUtil = require('../urlUtil');

var PAGE_SIZE = 10;

var getHighlight = function(highlights, docId) {
    if (!highlights) { return null; }

    var hDoc = highlights[docId];
    if (!hDoc) { return null; }

    if (!hDoc.desc && !hDoc.name_split) { return null; }

    return hDoc;
};

var catChildRegex = /\-0$/;

var isCategoryMatch = function(expanded, docId) {
    if (!expanded) {
        return false;
    }

    var appSection = expanded[docId];
    if (!appSection) {
        return false;
    }

    if (!appSection.docs || appSection.docs.length === 0) {
        return false;
    }

    return docId + '-0' === appSection.docs[0].id;
};

var getApps = function(expanded, highlights, docId) {
    if (!expanded) { return []; }

    var appSection = expanded[docId];
    if (!appSection) { return []; }

    var appDocs = appSection.docs.filter(function(appDoc) {
        return !catChildRegex.test(appDoc.id);
    });

    if (!appDocs) { return []; }

    return appDocs.map(function(appDoc) {
        var appResult = {
            name: appDoc.name,
            url: urlUtil.makeUrl(appDoc.url, appDoc.name),
            imageUrl: appDoc.image_url
        };

        var highlight = getHighlight(highlights, appDoc.id);

        if (highlight) {
            appResult.highlight = highlight;
        }

        return appResult;
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
            var category = {
                name: doc.cat_name,
                url: urlUtil.makeUrl(doc.url, doc.cat_name),
                isCategoryMatch: isCategoryMatch(expanded, doc.id)
            };

            var highlight = getHighlight(highlights, doc.id + '-0');
            var apps = getApps(expanded, highlights, doc.id);

            if (highlight) {
                category.highlight = highlight;
            }

            if (apps && apps.length > 0) {
                category.apps = apps;
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





