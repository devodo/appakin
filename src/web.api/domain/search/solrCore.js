'use strict';
var solr = require('solr-client');
var unidecode = require('unidecode');
var async = require('async');
var request = require('request');
var config = require('../../config');
var log = require('../../logger');

var CREATE_TEMP_CORE_URL = config.search.solr.createTempCoreUrl;
var host = config.search.solr.host;
var port = config.search.solr.port;

var solrAdminClient = solr.createClient(host, port, 'admin');

var SolrCore = function(coreName) {
    this.coreName = coreName;
    this.client = solr.createClient(host, port, coreName);
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

SolrCore.prototype.escapeSpecialCharsAllowQuotes = function(s){
    return s.replace(/([\+\-&\|!\(\)\{\}\[\]\^~\*\?:\\])/g, function(match) {
        return '\\' + match;
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

SolrCore.prototype.getTopWords = function(text, maxChars) {
    if (!text) {
        return null;
    }

    if (text.length <= maxChars) {
        return text;
    }

    var indexStart = Math.min(text.length - 1, maxChars);

    for (var i = indexStart; i > 0; i--) {
        if (text[i].match(/\s/)) {
            return text.substr(0, i);
        }
    }

    return '';
};

SolrCore.prototype.getCoreStatus = function (next) {
    var self = this;

    var endpoint = "action=STATUS&core=" + self.coreName;
    solrAdminClient.get('cores', endpoint, function (err, obj) {
        if (err) { return next(err); }

        next(null, obj);
    });
};

SolrCore.prototype.getCoreExists = function (next) {
    var self = this;

    self.getCoreStatus(function(err, obj) {
        if (err) { return next(err); }

        var exists = obj.status[self.coreName] && obj.status[self.coreName].name;
        next(null, exists);
    });
};

SolrCore.prototype.createTempCore = function (next) {
    var self = this;

    request({
        url: CREATE_TEMP_CORE_URL,
        method: 'POST',
        json: { coreName : self.coreName }
    }, function ( err, res, body) {
        if (err) { return next(err); }
        if (body.error) { return next(body.error); }

        var tempCoreName = body.tempCoreName;
        var tempCore = new SolrCore(tempCoreName);

        next(null, tempCore);
    });
};

SolrCore.prototype.swapCore = function (solrCore, next) {
    var self = this;

    var endpoint = "action=SWAP&core=" + solrCore.coreName + "&other=" + self.coreName;
    solrAdminClient.get('cores', endpoint, function (err, obj) {
        if (err) { return next(err); }

        next(null, obj);
    });
};

SolrCore.prototype.swapOrRenameCore = function (solrCore, next) {
    var self = this;

    self.getCoreExists(function(err, coreExists) {
        if (err) { return next(err); }

        var endpoint;
        if (coreExists) {
            endpoint = "action=SWAP&core=" + solrCore.coreName + "&other=" + self.coreName;
        } else {
            endpoint = "action=RENAME&core=" + solrCore.coreName + "&other=" + self.coreName;
        }

        solrAdminClient.get('cores', endpoint, function (err, obj) {
            if (err) { return next(err); }

            next(null, obj);
        });
    });
};

var categorySolrCore = null;
exports.getCategoryCore = function() {
    if (!categorySolrCore) {
        var coreName = config.search.solr.cores.category;
        categorySolrCore = new SolrCore(coreName);
    }

    return categorySolrCore;
};

var appSolrCore = null;
exports.getAppSolrCore = function() {
    if (!appSolrCore) {
        var coreName = config.search.solr.cores.app;
        appSolrCore = new SolrCore(coreName);
    }

    return appSolrCore;
};

var autoSolrCore = null;
exports.getAutoSolrCore = function() {
    if (!autoSolrCore) {
        var coreName = config.search.solr.cores.auto;
        autoSolrCore = new SolrCore(coreName);
    }

    return autoSolrCore;
};

var clusterSolrCore = null;
exports.getClusterCore = function() {
    if (!clusterSolrCore) {
        var coreName = config.search.solr.cores.cluster;
        clusterSolrCore = new SolrCore(coreName);
    }

    return clusterSolrCore;
};





