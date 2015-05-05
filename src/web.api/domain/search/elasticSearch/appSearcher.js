'use strict';
var urlUtil = require('../../urlUtil');
var config = require('../../../config');
var request = require('request');

var COMPLETE_SIZE = 6;
var CAT_PAGE_SIZE = 10;
var APP_PAGE_SIZE = 20;
var CAT_APP_PAGE_SIZE = 20;
var CAT_APP_SIZE = 12;

var buildFilterParams = function(filters) {
    var filterParam = '';

    if (filters.isIphone === true) {
        filterParam += '&isIphone=true';
    }

    if (filters.isIpad === true) {
        filterParam += '&isIpad=true';
    }

    if (filters.isFree === true) {
        filterParam += '&isFree=true';
    }

    return filterParam;
};

var buildMainUrlParams = function(query, pageNum, filters) {
    var catFrom = 0;
    if (pageNum && pageNum > 1) {
        catFrom = (pageNum - 1) * CAT_PAGE_SIZE;
    }

    var appSize = pageNum > 1 ? 0 : CAT_APP_SIZE;

    var queryParams = '?q=' + encodeURIComponent(query) +
        '&appSize=' + appSize +
        '&catFrom=' + catFrom +
        '&catSize=' + CAT_PAGE_SIZE +
        '&catAppSize=' + CAT_APP_SIZE +
        buildFilterParams(filters);

    return queryParams;
};

var buildCategoriesUrlParams = function(query, pageNum, filters) {
    var catFrom = 0;
    if (pageNum && pageNum > 1) {
        catFrom = (pageNum - 1) * CAT_PAGE_SIZE;
    }

    var queryParams = '?q=' + encodeURIComponent(query) +
        '&catFrom=' + catFrom +
        '&appSize=0&catSize=' + CAT_PAGE_SIZE +
        '&catAppSize=' + CAT_APP_SIZE +
        buildFilterParams(filters);

    return queryParams;
};

var buildCategoryAppsUrlParams = function(query, categoryId, pageNum, filters) {
    var appFrom = 0;
    if (pageNum && pageNum > 1) {
        appFrom = (pageNum - 1) * CAT_APP_PAGE_SIZE;
    }

    var queryParams = '?q=' + encodeURIComponent(query) +
        '&categoryId=' + categoryId +
        '&appFrom=' + appFrom +
        '&appSize=' + CAT_APP_PAGE_SIZE +
        buildFilterParams(filters);

    return queryParams;
};

var buildAppsUrlParams = function(query, pageNum, filters) {
    var appFrom = 0;
    if (pageNum && pageNum > 1) {
        appFrom = (pageNum - 1) * APP_PAGE_SIZE;
    }

    var queryParams = '?q=' + encodeURIComponent(query) +
        '&catSize=0&appFrom=' + appFrom +
        '&appSize=' + APP_PAGE_SIZE +
        buildFilterParams(filters);

    return queryParams;
};

var parseAppResults = function(appResults) {
    var apps = appResults.apps.map(function(appResult) {
        var app = {
            id: appResult.field.ext_id,
            name: appResult.field.name,
            url: urlUtil.makeUrl(appResult.field.ext_id, appResult.field.name),
            imageUrl: appResult.field.image_url,
            price: appResult.field.price,
            rating: appResult.field.rating
        };

        if (appResult.highlight) {
            app.highlight = {};

            if (appResult.highlight.name_stem) {
                app.highlight.name = appResult.highlight.name_stem;
            }

            if (appResult.highlight.desc_stem) {
                app.highlight.desc = appResult.highlight.desc_stem;
            }
        }

        if (appResult.field.desc_short) {
            app.desc = appResult.field.desc_short;
        }

        return app;
    });

    return apps;
};

var parseAppResultsMain = function(appResults) {
    if (!appResults) {
        return {};
    }

    return {
        total: appResults.total,
        apps: parseAppResults(appResults)
    };
};

var search = function(query, pageNum, filters, next) {
    var queryParams = buildMainUrlParams(query, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, searchResult) {
        if (err) { return next(err); }
        if (searchResult.error) { return next(new Error(searchResult.error)); }

        var result = {
            page: pageNum,
            suggestions: []
        };

        if (searchResult.result.app) {
            result.appResults = parseAppResultsMain(searchResult.result.app);
        }

        if (searchResult.result.suggestions) {
            result.suggestions = searchResult.result.suggestions.map(function (suggestion) {
                return suggestion.text;
            });
        }

        var categories = searchResult.result.category.categories.
            filter(function(categoryResult) {
                return true;
                return categoryResult.app;
            }).
            map(function(categoryResult) {
                var category = {
                    id: categoryResult.id,
                    app: parseAppResultsMain(categoryResult.app)
                };

                return category;
            });

        result.categoryResults = {
            total: searchResult.result.category.total,
            categories: categories
        };

        next(null, result);
    });
};

var searchCategories = function(query, pageNum, filters, next) {
    var queryParams = buildCategoriesUrlParams(query, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, searchResult) {
        if (err) { return next(err); }
        if (searchResult.error) { return next(new Error(searchResult.error)); }

        var result = {
            page: pageNum,
            total: searchResult.result.category.total,
            suggestions: []
        };

        if (searchResult.result.suggestions) {
            result.suggestions = searchResult.result.suggestions.map(function (suggestion) {
                return suggestion.text;
            });
        }

        result.categories = searchResult.result.category.categories.map(function (categoryResult) {
            var category = {};

            category.id = categoryResult.id;
            category.totalApps = categoryResult.app.total;
            category.apps = parseAppResults(categoryResult.app);

            return category;
        });

        next(null, result);
    });
};

var searchCategoryApps = function(query, categoryId, pageNum, filters, next) {
    var queryParams = buildCategoryAppsUrlParams(query, categoryId, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/category' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, searchResult) {
        if (err) { return next(err); }
        if (searchResult.error) { return next(new Error(searchResult.error)); }

        var result = {
            page: pageNum,
            total: 0
        };

        if (searchResult.result.length > 0) {
            result.id = searchResult.result[0].id;
            result.total = searchResult.result[0].app.total;
            result.apps = parseAppResults(searchResult.result[0].app);
        }

        next(null, result);
    });
};

var searchApps = function(query, pageNum, filters, next) {
    var queryParams = buildAppsUrlParams(query, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, searchResult) {
        if (err) { return next(err); }
        if (searchResult.error) { return next(new Error(searchResult.error)); }

        var result = {
            page: pageNum,
            total: searchResult.result.app.total,
            apps: parseAppResults(searchResult.result.app)
        };

        next(null, result);

    });
};

var searchComplete = function(query, next) {
    var queryParams = '?q=' + encodeURIComponent(query) + '&size=' + COMPLETE_SIZE;
    var queryUrl = config.search.esAdmin.url + 'search/complete' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, body) {
        if (err) { return next(err); }

        var suggestions = body.result.map(function(option) {
            return option.text;
        });

        next(null, suggestions);

    });
};

exports.search = search;
exports.searchCategories = searchCategories;
exports.searchCategoryApps = searchCategoryApps;
exports.searchApps = searchApps;
exports.searchComplete = searchComplete;





