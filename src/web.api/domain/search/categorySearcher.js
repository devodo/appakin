'use strict';
var solrCore = require('./solrCore').getCategoryCore();
var urlUtil = require('../urlUtil');

var CAT_PAGE_SIZE = 10;
var APP_PAGE_SIZE = 12;
var CAT_APP_PAGE_SIZE = 20;

var getAppHighlight = function(highlights, docId) {
    if (!highlights) { return null; }

    var hDoc = highlights[docId];
    if (!hDoc) { return null; }

    if (!hDoc.desc_split && !hDoc.name_split) { return null; }

    return {
        name: hDoc.name_split,
        desc: hDoc.desc_split
    };
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
            name: appDoc.name_split,
            url: urlUtil.makeUrl(appDoc.id, appDoc.name_split),
            imageUrl: appDoc.image_url,
            price: appDoc.price,
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
    var solrQuery = 'rows=' + CAT_PAGE_SIZE + '&qq=' + q + '&spellcheck.q=' + q + filter;

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
                name: doc.cat_name_split,
                url: urlUtil.makeUrl(doc.id, doc.cat_name_split)
            };

            var appResult = getApps(expanded, highlights, doc.id);
            if (appResult && appResult.apps.length > 0) {
                category.totalApps = appResult.total;
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

var searchApps = function(queryStr, pageNum, categoryId, filters, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialChars(queryStr));
    var filter = buildFilterQuery(filters);
    var solrQuery = 'rows=' + CAT_APP_PAGE_SIZE + '&qq=' + q + '&cat_id=' + categoryId + filter;

    if (pageNum && pageNum > 1) {
        var start = (pageNum - 1) * CAT_APP_PAGE_SIZE;
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
                name: doc.name_split,
                url: urlUtil.makeUrl(doc.id, doc.name_split),
                imageUrl: doc.image_url,
                price: doc.price,
                position: doc.position
            };

            var highlight = getAppHighlight(highlights, doc.id);

            if (highlight) {
                app.highlight = highlight;
            }

            return app;
        });

        var searhcResult = {
            total: obj.response.numFound,
            page: pageNum,
            apps: apps
        };

        next(null, searhcResult);
    });
};

exports.search = search;
exports.searchApps = searchApps;





