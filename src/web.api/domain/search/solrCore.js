'use strict';
var solr = require('solr-client');
var unidecode = require('unidecode');
var config = require('../../config');

var SolrCore = function(client) {
    this.client = client;
};

SolrCore.prototype.commit = function (next) {
    var me = this;

    me.client.commit(function(err, res){
        if(err) {
            return next(err);
        }

        return next(null, res);
    });
};

SolrCore.prototype.preProcessText = function(input) {
    var output = input.replace(/^&amp;\s|\s&amp;\s|\s&amp;$/g, " and ");
    output = output.replace(/['"]/g, "");
    output = output.replace(/[\s\-_]+/g, " ");
    output = output.toLowerCase();
    output = output.trim();

    return output;
};

SolrCore.prototype.asciiFold = function(input) {
    return unidecode(input);
};

var createSolrCore = function(coreName) {
    var host = config.search.solr.host;
    var port = config.search.solr.port;
    var client = solr.createClient(host, port, coreName);
    var solrCore = new SolrCore(client);

    return solrCore;
};

exports.getCategoryCore = function() {
    var coreName = config.search.solr.cores.category;
    var solrCore = createSolrCore(coreName);
    return solrCore;
};

exports.getAppSolrCore = function() {
    var coreName = config.search.solr.cores.app;
    var solrCore = createSolrCore(coreName);
    return solrCore;
};

exports.getAutoSolrCore = function() {
    var coreName = config.search.solr.cores.auto;
    var solrCore = createSolrCore(coreName);
    return solrCore;
};





