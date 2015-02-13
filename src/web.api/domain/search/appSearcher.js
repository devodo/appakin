'use strict';
var solrCore = require('./solrCore').getAppSolrCore();
var urlUtil = require('../urlUtil');
var log = require('../../logger');

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
    var solrQuery = 'rows=' + PAGE_SIZE + '&qq=' + q + '&spellcheck.q=' + q + filter;

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
                id: doc.id,
                name: doc.name_split,
                url: urlUtil.makeUrl(doc.id, doc.name_split),
                imageUrl: doc.img_url,
                price: doc.price,
                popularity: doc.popularity
            };

            if (highlight) {
                app.highlight = highlight;
            }

            return app;
        });

        var suggestions = solrCore.getSuggestions(obj.spellcheck);

        var searchResult = {
            total: obj.response.numFound,
            page: pageNum,
            apps: apps,
            suggestions: suggestions
        };

        next(null, searchResult);
    });
};

var searchDevAmbiguous = function(name, devName, next) {
    var nameEncoded = encodeURIComponent(solrCore.escapeSolrParserChars(name));
    var devNameEncoded = encodeURIComponent(solrCore.escapeSolrParserChars(devName));

    var solrQuery =
        'q=name:"' + nameEncoded + '"' +
        '&fq=publisher:"' + devNameEncoded +'"' +
        '&sort=popularity%20desc&q.op=AND&rows=100' +
        '&fl=id,name_split,popularity';

    solrCore.client.get('select', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc) {

            var app = {
                id: doc.id,
                name: doc.name_split,
                popularity: doc.popularity
            };

            return app;
        });

        var searchResult = {
            total: obj.response.numFound,
            apps: apps
        };

        next(null, searchResult);
    });
};

var searchGlobalAmbiguous = function(name, devName, next) {
    var nameEncoded = encodeURIComponent(solrCore.escapeSolrParserChars(name));

    var solrQuery =
        'q=name:"' + nameEncoded + '"' +
        '&sort=popularity%20desc&q.op=AND&rows=1' +
        '&fl=id,popularity';

    if (devName) {
        var devNameEncoded = encodeURIComponent(solrCore.escapeSolrParserChars(devName));
        solrQuery += '&fq=-publisher:"' + devNameEncoded +'"';
    }

    solrCore.client.get('select', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc) {

            var app = {
                id: doc.id,
                popularity: doc.popularity
            };

            return app;
        });

        var searchResult = {
            total: obj.response.numFound,
            apps: apps
        };

        next(null, searchResult);
    });
};

exports.search = search;
exports.searchDevAmbiguous = searchDevAmbiguous;
exports.searchGlobalAmbiguous = searchGlobalAmbiguous;





