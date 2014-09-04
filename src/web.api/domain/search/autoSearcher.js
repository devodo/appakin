'use strict';
var solr = require('solr-client');
var async = require('async');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var PAGE_SIZE = 6;

var search = function(queryStr, pageNum, next) {
    var query = solrCore.client.createQuery();
    query.q(queryStr);
    query.rows(PAGE_SIZE);

    if (pageNum && pageNum > 1) {
        query.start((pageNum - 1) * PAGE_SIZE);
    }

    solrCore.client.get('custom', query, function (err, obj) {
        if (err) {
            return next(err);
        }

        next(null, obj.response);
    });
};

exports.search = search;





