'use strict';

var fs = require('fs');
var config = require('../../config');
var log = require('../../logger');

var Classifier = function() {
    var nodesvm = require('node-svm');
    this.svm = new nodesvm.CSVC({ // classification
        kernelType: nodesvm.KernelTypes.RBF,
        //gamma: [0.01],
        //C: [0.5, 1, 2, 4, 8],
        reduce: false,
        normalize: false
    });
};

Classifier.prototype.train = function(trainingData, next) {
    this.svm.train(trainingData, function(report) {
        log.info('SVM trained. report :\n%s', JSON.stringify(report, null, '\t'));
        next();
    });
};

Classifier.prototype.predict = function(matrix) {
    var self = this;
    var results = [];

    matrix.forEach(function(vector) {
        var result = self.svm.predict(vector);
        results.push(result);
    });

    return results;
};

var ClassifierAnalyser = function() {
    this.titleTermMatrix = new TermMatrix(20, 3, 1, 0, 0.1, 0.5, 0.1);
    this.descTermMatrix = new TermMatrix(50, 3, 1, 1.2, 0.3, 0.5, 0.1);
    this.docMap = {};
    this.docIndex = [];
};

ClassifierAnalyser.prototype.totalDocs = function() {
    return this.docIndex.length;
};

ClassifierAnalyser.prototype.addDoc = function(doc) {
    var self = this;
    self.titleTermMatrix.addTermVector(doc.name);
    self.descTermMatrix.addTermVector(doc.desc);
    self.docMap[doc.id] = self.docIndex.length;
    self.docIndex.push(doc.id);
};

ClassifierAnalyser.prototype.buildVectorMatrix = function() {
    var self = this;

    var vectorMatrix = [];
    for (var i = 0; i < self.docIndex.length; i++) {
        vectorMatrix[i] = [];
    }

    self.titleTermMatrix.buildTermMatrix(vectorMatrix, 0);
    var indexOffset = self.titleTermMatrix.termIndex;
    self.descTermMatrix.buildTermMatrix(vectorMatrix, indexOffset);

    return {
        vectorMatrix: vectorMatrix,
        docMap: self.docMap,
        docIndex: self.docIndex
    };
};

ClassifierAnalyser.prototype.getDocTopTerms = function(doc) {
    var self = this;
    var titleTerms = self.titleTermMatrix.getTopScoringTerms(doc.name);
    var descTerms = self.descTermMatrix.getTopScoringTerms(doc.desc);

    return {
        title: titleTerms,
        desc: descTerms
    };
};

ClassifierAnalyser.prototype.getTopTerms = function(titleLimit, descLimit) {
    var self = this;
    var titleTerms = self.titleTermMatrix.getTopTerms(titleLimit);
    var descTerms = self.descTermMatrix.getTopTerms(descLimit);

    return {
        title: titleTerms,
        desc: descTerms
    };
};

var TermMatrix = function(maxTerms, minDocFreq, minTermLength, tfBoost, positionDecay, idfBoost, smoothFactor) {
    this.maxTerms = maxTerms;
    this.minDocFreq = minDocFreq;
    this.minTermLength = minTermLength;
    this.tfBoost = tfBoost;
    this.positionDecay = positionDecay;
    this.idfBoost = idfBoost;
    this.smoothFactor = smoothFactor;

    this.termDictionary = {};
    this.termIndex = 0;
    this.indexedTermMatrix = [];
};

TermMatrix.prototype.addTermVector = function(termVector) {
    var self = this;

    var termScores = self.getTopScoringTerms(termVector);

    var indexedTermVector = [];

    termScores.forEach(function(termScore) {
        var termEntry = self.termDictionary[termScore.term];
        if (!termEntry && termEntry !== 0) {
            termEntry = {
                score: 0,
                docFreq: 0,
                index: self.termIndex++
            };
            self.termDictionary[termScore.term] = termEntry;
        }

        termEntry.score += termScore.score;
        termEntry.docFreq++;
        indexedTermVector[termEntry.index] = termScore.score;
    });

    self.indexedTermMatrix.push(indexedTermVector);
};

TermMatrix.prototype.getTopScoringTerms = function(termVector) {
    var self = this;

    var results = [];

    termVector.forEach(function(termInfo) {
        if (termInfo.term.length < self.minTermLength) {
            return;
        }

        if (isStopWord(termInfo.term)) {
            return;
        }

        if (termInfo.docFreq < self.minDocFreq) {
            return;
        }

        var decayFactor = Math.pow(termInfo.positions[0] + 1, self.positionDecay);
        var tf = Math.pow(termInfo.termFreq, self.tfBoost) / decayFactor;

        //var idfRaw = Math.log(882439 / termInfo.docFreq) / Math.log(10);
        //var idf = Math.pow(idfRaw, self.idfBoost);
        var df = Math.pow(termInfo.docFreq, self.idfBoost);
        var tfIdf = tf / df;

        if (tfIdf <= 0) {
            return;
        }

        results.push({
            term: termInfo.term,
            tf: tf,
            df: df,
            tfIdf: tfIdf
        });
    });

    results.sort(function(a, b) {
        return b.tfIdf - a.tfIdf;
    });

    results = results.splice(0, self.maxTerms);

    results.forEach(function(result) {
        var diff = results[0].tfIdf - result.tfIdf;
        var smooth = results[0].tfIdf - (diff * self.smoothFactor);
        result.score = (result.tfIdf / smooth);
    });

    return results;
};

TermMatrix.prototype.buildTermMatrix = function(matrix, indexOffset) {
    var self = this;

    self.indexedTermMatrix.forEach(function(indexedTermVector, row) {
        for (var i = 0; i < self.termIndex; i++) {
            matrix[row][i + indexOffset] = indexedTermVector[i] ? indexedTermVector[i] : 0;
        }
    });
};

TermMatrix.prototype.getTopTerms = function(limit) {
    var self = this;

    var termInfos = [];

    Object.keys(self.termDictionary).forEach(function(key) {
        var termEntry = self.termDictionary[key];

        var termInfo = {
            term: key,
            stats: termEntry
        };

        termInfos.push(termInfo);
    });

    termInfos.sort(function(a, b) {
        return b.stats.score - a.stats.score;
    });

    return termInfos.splice(0, limit);
};

var stopwords = null;

var isStopWord = function(word) {
    if (!stopwords) {
        stopwords = {};
        var contents = fs.readFileSync(config.search.stopwordFile).toString();
        var lines = contents.replace(/\r/g, '').split(/\n/g);
        lines.forEach(function(line) {
            if (line.match(/^\s*#/)) { return; } // ignore commented lines
            stopwords[line] = true;
        });
    }

    return stopwords[word];
};

exports.createClassifierAnalyser = function() {
    return new ClassifierAnalyser();
};

exports.createClassifier = function() {
    return new Classifier();
};