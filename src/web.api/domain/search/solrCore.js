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

SolrCore.prototype.optimise = function (next) {
    var me = this;

    me.client.optimize(function(err, res){
        if(err) {
            return next(err);
        }

        return next(null, res);
    });
};

SolrCore.prototype.escapeSpecialChars = function(s){
    return s.replace(/([\+\-&\|!\(\)\{\}\[\]\^"~\*\?:\\])/g, function(match) {
        return '\\' + match;
    });
};

SolrCore.prototype.preProcessDisplayText = function(input) {
    var output = input.replace(/\s+/g, " ");
    output = output.toLowerCase();
    output = output.trim();

    return output;
};

SolrCore.prototype.preProcessIndexText = function(input) {
    var output = input.replace(/^&[\s_\-]|[\s_\-]&[\s_\-]|[\s_\-]&$/g, " and ");
    output = output.replace(/['"]/g, "");
    output = output.replace(/[\s_\-]+/g, " ");
    output = output.toLowerCase();
    output = output.trim();

    return output;
};

SolrCore.prototype.asciiFold = function(input) {
    return unidecode(input);
};

SolrCore.prototype.getSuggestions = function(spellCheckSection) {
    if (!spellCheckSection) { return []; }
    var suggestions = spellCheckSection.suggestions;
    if (!suggestions) { return []; }

    var results = [];
    for (var i = 0; i < suggestions.length; i++) {
        if (suggestions[i] !== 'collation') { continue; }

        i = i + 1;
        if (i >= suggestions.length) { break; }

        results.push(suggestions[i]);
    }

    return results;
};

SolrCore.prototype.stopwords_en =
{
    "a": true,
    "an": true,
    "and": true,
    "are": true,
    "as": true,
    "at": true,
    "be": true,
    "but": true,
    "by": true,
    "for": true,
    "if": true,
    "in": true,
    "into": true,
    "is": true,
    "it": true,
    "no": true,
    "not": true,
    "of": true,
    "on": true,
    "or": true,
    "such": true,
    "that": true,
    "the": true,
    "their": true,
    "then": true,
    "there": true,
    "these": true,
    "they": true,
    "this": true,
    "to": true,
    "was": true,
    "will": true,
    "with": true,
    "&": true,
    "-": true,
    "—": true,
    ":": true
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





