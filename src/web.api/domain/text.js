'use strict';

var natural = require('natural'),
    tokenizer = new natural.WordTokenizer();

var weightIntegral = function(x) {
    //return 10.0/(Math.pow(x, 0.1));
    //return 2.0/(Math.sqrt(x));
    //return (5.0 * Math.pow(x, 4.0 / 5.0)) / 4.0;
    //return 1/Math.pow(x, 0.1);
    return Math.log(x);
};

var weightIntegralBounded = function(lowerBound, upperBound) {
    var lower = weightIntegral(lowerBound);
    var upper = weightIntegral(upperBound);

    return lower - upper;
};

var CorpusTermFrequency = function(totalDocs) {
    this._totalDocs = totalDocs;
    this._termFrequencies = {};
};

exports.CreateCorpusTermFrequency = function(totalDocs) {
    return new CorpusTermFrequency(totalDocs);
};

exports.LoadCorpusTermFrequency = function(memento) {
    var corpusFrequency = new CorpusTermFrequency(memento.totalDocuments);
    corpusFrequency.setTermFrequencies(memento.termFrequencies);

    return corpusFrequency;
};

CorpusTermFrequency.prototype.setTermFrequencies = function(termFrequencies) {
    this._termFrequencies = termFrequencies;
};

CorpusTermFrequency.prototype.saveToMemento = function() {
    var memento = {
        totalDocuments: this._totalDocs,
        termFrequencies: this._termFrequencies
    };

    return memento;
};

CorpusTermFrequency.prototype.appendDocumentTermFrequencies = function(termFrequencies) {
    var me = this;

    Object.keys(termFrequencies).forEach(function(term) {
        if (term in me._termFrequencies) {
            me._termFrequencies[term] += termFrequencies[term];
        } else {
            me._termFrequencies[term] = termFrequencies[term];
        }
    });
};

CorpusTermFrequency.prototype.convertToTfIdf = function(termFrequencies) {
    var me = this;

    Object.keys(termFrequencies).forEach(function(term) {
        var tf = termFrequencies[term];
        var df = me._termFrequencies[term];
        var idf = Math.log(me._totalDocs / df) / Math.LN10;

        termFrequencies[term] = tf * idf;
    });
};

var DocumentTermFrequency = function(totalFragments) {
    this._scaleFactor = (totalFragments + 1) / 10.0;
    this._totalWeight = this.positionWeight(1, totalFragments + 1);
    this._termFrequencies = {};
    this._documentFrequencies = {};
};

exports.CreateDocumentTermFrequency = function(totalFragments) {
    return new DocumentTermFrequency(totalFragments);
};

DocumentTermFrequency.prototype.getTermFrequencies = function() {
    return this._termFrequencies;
};

DocumentTermFrequency.prototype.getDocumentFrequencies = function() {
    return this._documentFrequencies;
};

DocumentTermFrequency.prototype.appendTermFrequencies = function(termFrequencies, position) {
    var me = this;
    var weight = me.positionWeight(position, position + 1) / me._totalWeight;

    Object.keys(termFrequencies).forEach(function(term) {
        if (term in me._termFrequencies) {
            me._termFrequencies[term] += termFrequencies[term] * weight;
        } else {
            me._termFrequencies[term] = termFrequencies[term] * weight;
        }
    });
};

DocumentTermFrequency.prototype.appendDocumentTermFrequencies = function(termFrequencies, position) {
    var me = this;
    var weight = me.positionWeight(position, position + 1) / me._totalWeight;

    Object.keys(termFrequencies).forEach(function(term) {
        if (term in me._documentFrequencies) {
            me._documentFrequencies[term] += weight;
        } else {
            me._documentFrequencies[term] = weight;
        }
    });
};

DocumentTermFrequency.prototype.appendDocumentFragment = function(fragment, position) {
    var me = this;

    var termFrequencies = extractTermFrequencies(fragment);
    me.appendDocumentTermFrequencies(termFrequencies, position);
};

DocumentTermFrequency.prototype.positionWeight = function(lower, upper) {
    var me = this;
    var scaledLower = lower / me._scaleFactor;
    var scaledUpper = upper / me._scaleFactor;

    return weightIntegralBounded(scaledLower, scaledUpper);
};

var porterStemmer = natural.PorterStemmer;
var extractTermFrequencies = function(body) {
    var keywords = {};
    if (!body) { return keywords; }

    var tokens = tokenizer.tokenize(body);
    tokens.forEach(function(token) {
        token = token.toLowerCase();
        token = porterStemmer.stem(token);
        if (token in keywords) {
            keywords[token]++;
        } else {
            keywords[token] = 1;
        }
    });

    return keywords;
};

exports.extractTermFrequencies = extractTermFrequencies;

exports.sortTermFrequencies = function(termFrequencies) {
    var sortable = [];
    Object.keys(termFrequencies).forEach(function(term) {
        sortable.push([term, termFrequencies[term]]);
    });

    var sorted = sortable.sort(function(a, b) {
        return b[1] - a[1];
    });

    return sorted;
};








