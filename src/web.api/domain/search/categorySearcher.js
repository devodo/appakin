'use strict';
var slug = require('slug');
var solrCore = require('./solrCore').getCategoryCore();
var urlUtil = require('../urlUtil');

var PAGE_SIZE = 10;

var getHighlight = function(highlights, docId) {
    if (!highlights) { return null; }

    var hDoc = highlights[docId];
    if (!hDoc) { return null; }

    if (!hDoc.desc_split && !hDoc.cat_desc_split && !hDoc.name_split) { return null; }

    if (hDoc.name_split) {
        hDoc.name = hDoc.name_split;
        delete hDoc.name_split;
    }

    if (hDoc.cat_desc_split) {
        hDoc.desc = hDoc.cat_desc_split;
        delete hDoc.cat_desc_split;
    }

    if (hDoc.desc_split) {
        hDoc.desc = hDoc.desc_split;
        delete hDoc.desc_split;
    }

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

    var appArray = [];
    var appsMap = {};
    var maxScore = 0;
    if (appDocs.length > 0) {
        maxScore = parseFloat(appDocs[0].score);
    }

    for (var i = 0; i < appDocs.length; i++) {
        var appDoc = appDocs[i];

        var appResult = {
            name: appDoc.name,
            url: urlUtil.makeUrl(appDoc.url, appDoc.name),
            imageUrl: appDoc.image_url
        };

        var highlight = getHighlight(highlights, appDoc.id);

        if (highlight) {
            appResult.highlight = highlight;
        }

        appArray.push(appResult);
        appsMap[appDoc.position] = appResult;
    }

    return {
        apps: appArray,
        appsMap: appsMap,
        maxScore: maxScore
    };
};

var getChartApps = function(catChart, appsMap) {
    if (!catChart) { return []; }

    var chartApps = JSON.parse(catChart);

    return chartApps.map(function(chartApp) {
        var appResult = appsMap[chartApp.position];

        if (!appResult) {
            appResult = {
                name: chartApp.name,
                url: urlUtil.makeUrl(chartApp.url, chartApp.name),
                imageUrl: chartApp.image_url
            };
        }

        return appResult;
    });
};

var search = function(queryStr, pageNum, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialCharsAllowQuotes(queryStr));
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
            var isCatMatch = isCategoryMatch(expanded, doc.id);
            var appResult = getApps(expanded, highlights, doc.id);
            var catScore = parseFloat(doc.score);
            var useChartApps = isCatMatch && appResult.maxScore / catScore < 0.09;

            var category = {
                name: doc.cat_name,
                url: urlUtil.makeUrl(doc.url, doc.cat_name),
                isCategoryMatch: useChartApps
            };

            var highlight = getHighlight(highlights, doc.id + '-0');

            var apps = useChartApps ? getChartApps(doc.cat_chart, appResult.appsMap) : appResult.apps.splice(0, 6);

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

var searchApps = function(queryStr, pageNum, categoryId, next) {
    var q = encodeURIComponent(solrCore.escapeSpecialChars(queryStr));
    var solrQuery = 'rows=' + PAGE_SIZE + '&qq=' + q + '&fq={!cache=false}parent_id:' + categoryId;

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
            var app = {
                name: doc.name,
                url: urlUtil.makeUrl(doc.url, doc.name),
                imageUrl: doc.image_url,
                position: doc.position
            };

            var highlight = getHighlight(highlights, doc.id);

            if (highlight) {
                app.highlight = highlight;
            }

            return apps;
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





