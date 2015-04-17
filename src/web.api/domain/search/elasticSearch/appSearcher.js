'use strict';
var urlUtil = require('../../urlUtil');
var config = require('../../../config');
var request = require('request');

var COMPLETE_SIZE = 6;
var CAT_PAGE_SIZE = 10;
var APP_PAGE_SIZE = 12;
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


var search = function(query, pageNum, filters, next) {
    var queryParams = '?q=' + encodeURIComponent(query);

    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, body) {
        if (err) { return next(err); }

        next(null, body);

    });
};

var searchCategories = function(query, pageNum, filters, next) {
    var queryParams = buildCategoriesUrlParams(query, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, body) {
        if (err) { return next(err); }

        next(null, body);

    });
};

var searchApps = function(query, pageNum, filters, next) {
    var queryParams = buildCategoriesUrlParams(query, pageNum, filters);
    var queryUrl = config.search.esAdmin.url + 'search/main' + queryParams;

    request({url: queryUrl, pool: false, json: true}, function (err, resp, body) {
        if (err) { return next(err); }

        next(null, body);

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
exports.searchComplete = searchComplete;





