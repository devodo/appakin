'use strict';
var async = require('async');
var log = require('../../logger');
var solrCore = require('./solrCore').getCategoryCore();

var PAGE_SIZE = 10;

function escapeSpecialChars(s){
    return s.replace(/([\+\-&\|!\(\)\{\}\[\]\^"~\*\?:\\])/g, function(match) {
        return '\\' + match;
    });
}

var search = function(queryStr, pageNum, next) {
    queryStr = solrCore.preProcessIndexText(queryStr);

    var q = encodeURIComponent(escapeSpecialChars(queryStr));
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

            var highlight = (function() {
                if (!highlights) { return null; }

                var hDoc = highlights[doc.id];
                if (!hDoc) { return null; }

                var hDesc = hDoc.desc_split;
                if (!hDesc || hDesc.length < 1) { return null; }

                return hDesc[0];
            })();

            var apps = (function() {
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
            })();

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

        var searhcResult = {
            total: obj.response.numFound,
            categories: categories
        };

        next(null, searhcResult);
    });
};

exports.search = search;





