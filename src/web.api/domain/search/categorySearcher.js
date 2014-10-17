'use strict';
var slug = require('slug');
var solrCore = require('./solrCore').getCategoryCore();
var urlUtil = require('../urlUtil');

var CAT_PAGE_SIZE = 10;
var APP_PAGE_SIZE = 12;
var MAX_CAT_APPS = 60;

var getAppHighlight = function(highlights, docId) {
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

var getCatHighlight = function(highlights, docId) {
    if (!highlights) { return null; }

    var hDoc = highlights[docId];
    if (!hDoc) { return null; }

    if (!hDoc.cat_name_split) { return null; }

    if (hDoc.cat_name_split) {
        hDoc.name = hDoc.cat_name_split;
        delete hDoc.cat_name_split;
    }

    return hDoc;
};

var getApps = function(expanded, highlights, docId) {
    if (!expanded) { return null; }

    var appSection = expanded[docId];
    if (!appSection) { return null; }

    var appDocs = appSection.docs;
    if (!appDocs) { return null; }

    var apps = appDocs.map(function(appDoc) {
        var app = {
            id: appDoc.id,
            name: appDoc.name,
            url: urlUtil.makeUrl(appDoc.id, appDoc.name),
            imageUrl: appDoc.image_url,
            position: appDoc.position
        };

        var highlight = getAppHighlight(highlights, appDoc.id);

        if (highlight) {
            app.highlight = highlight;
        }

        return app;
    });

    return {
        total: appSection.numFound,
        apps: apps
    };
};

var search = function(queryStr, pageNum, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialCharsAllowQuotes(queryStr));
    var solrQuery = 'rows=' + CAT_PAGE_SIZE + '&qq=' + q + '&spellcheck.q=' + q;

    if (pageNum && pageNum > 1) {
        var start = (pageNum - 1) * CAT_PAGE_SIZE;
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
                id: doc.id,
                name: doc.cat_name,
                url: urlUtil.makeUrl(doc.id, doc.cat_name)
            };

            var appResult = getApps(expanded, highlights, doc.id);
            if (appResult && appResult.apps.length > 0) {
                category.totalApps = Math.min(appResult.total, MAX_CAT_APPS);
                category.apps = appResult.apps;
            }

            var highlight = getCatHighlight(highlights, doc.id);
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

var searchApps = function(queryStr, pageNum, categoryId, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialChars(queryStr));
    var solrQuery = 'rows=' + APP_PAGE_SIZE + '&qq=' + q + '&cat_id=' + categoryId;

    if (pageNum && pageNum > 1) {
        var start = (pageNum - 1) * APP_PAGE_SIZE;
        solrQuery += '&start=' + start;
    }

    solrCore.client.get('custom_app', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var highlights = obj.highlighting;

        var apps = obj.response.docs.map(function(doc) {
            var app = {
                id: doc.id,
                name: doc.name,
                url: urlUtil.makeUrl(doc.id, doc.name),
                imageUrl: doc.image_url,
                position: doc.position
            };

            var highlight = getAppHighlight(highlights, doc.id);

            if (highlight) {
                app.highlight = highlight;
            }

            return app;
        });

        var searhcResult = {
            total: Math.min(obj.response.numFound, MAX_CAT_APPS),
            page: pageNum,
            apps: apps
        };

        next(null, searhcResult);
    });
};

exports.search = search;
exports.searchApps = searchApps;





