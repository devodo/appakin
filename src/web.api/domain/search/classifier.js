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
    var resultSettings = {
        maxTerms: 50,
        smoothFactor: 1.0,
        tieBreak: 0.1,
        maxDocFreq: 800000
    };

    var titleSettings = {
        minDocFreq: 5,
        minTermLength: 1,
        tfBoost: 0,
        posDecayTail: 2,
        posDecayWeight: 2.5,
        dfWeight: 2.5,
        titleBoost: 1.0
    };

    var descSettings = {
        minDocFreq: 5,
        minTermLength: 1,
        tfBoost: 0.5,
        posDecayTail: 2,
        posDecayWeight: 2.5,
        dfWeight: 2.5
    };

    this.termMatrix = new TermMatrix(resultSettings, titleSettings, descSettings);
    this.docMap = {};
    this.docIndex = [];
};

ClassifierAnalyser.prototype.totalDocs = function() {
    return this.docIndex.length;
};

ClassifierAnalyser.prototype.addDoc = function(doc) {
    var self = this;
    self.termMatrix.addDoc(doc);
    self.docMap[doc.id] = self.docIndex.length;
    self.docIndex.push(doc.id);
};

ClassifierAnalyser.prototype.buildVectorMatrix = function() {
    var self = this;

    var vectorMatrix = self.termMatrix.buildTermMatrix();

    return {
        vectorMatrix: vectorMatrix,
        docMap: self.docMap,
        docIndex: self.docIndex
    };
};

ClassifierAnalyser.prototype.getDocTopTerms = function(doc) {
    var self = this;
    var result = self.termMatrix.getTopScoringTerms(doc);

    return result;
};

var TermMatrix = function(resultSettings, titleSettings, descSettings) {
    this.resultSettings = resultSettings;
    this.titleSettings = titleSettings;
    this.descSettings = descSettings;

    this.termDictionary = {};
    this.termIndex = 0;
    this.indexedTermMatrix = [];
};

TermMatrix.prototype.addDoc = function(doc) {
    var self = this;

    var termScores = self.getTopScoringTerms(doc);

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

TermMatrix.prototype.getTitleTermScoresMap = function(titleTermVector) {
    var self = this;

    var results = {};

    var lastPosition = 0;

    titleTermVector.forEach(function(termInfo) {
        var pos = termInfo.positions[termInfo.positions.length - 1];
        if (pos > lastPosition) {
            lastPosition = pos;
        }
    });

    titleTermVector.forEach(function(termInfo) {
        if (termInfo.term.length < self.titleSettings.minTermLength) {
            return;
        }

        if (isStopWord(termInfo.term)) {
            return;
        }

        if (termInfo.docFreq < self.titleSettings.minDocFreq) {
            return;
        }

        var inversePosVal = logBase(termInfo.positions[0] + 1, (lastPosition + 2) * self.titleSettings.posDecayTail);
        var posDecay = 1 - Math.pow(inversePosVal, self.titleSettings.posDecayWeight);
        var tf = Math.pow(termInfo.termFreq, self.titleSettings.tfBoost)  * posDecay;

        var idf = 0;
        if (termInfo.docFreq < self.resultSettings.maxDocFreq) {
            var df = logBase(termInfo.docFreq, self.resultSettings.maxDocFreq);
            idf = 1 - Math.pow(df, self.titleSettings.dfWeight);
        }

        var tfIdf = Math.pow(tf * idf, self.titleSettings.titleBoost);

        results[termInfo.term] = {
            term: termInfo.term,
            title: {
                termFreq: termInfo.termFreq,
                position: termInfo.positions[0],
                posDecay: posDecay,
                tf: tf,
                docFreq: termInfo.docFreq,
                idf: idf,
                tfIdf: tfIdf
            }
        };
    });

    return results;
};

var logBase = function(x,b) {
    return Math.log(x) / Math.log(b);
};

TermMatrix.prototype.getDescTermScores = function(descTermVector) {
    var self = this;

    var results = [];

    var lastPosition = 0;

    descTermVector.forEach(function(termInfo) {
        var pos = termInfo.positions[termInfo.positions.length - 1];
        if (pos > lastPosition) {
            lastPosition = pos;
        }
    });

    descTermVector.forEach(function(termInfo) {
        if (termInfo.term.length < self.descSettings.minTermLength) {
            return;
        }

        if (isStopWord(termInfo.term)) {
            return;
        }

        if (termInfo.docFreq < self.descSettings.minDocFreq) {
            return;
        }

        var inversePosVal = logBase(termInfo.positions[0] + 1, (lastPosition + 2) * self.descSettings.posDecayTail);
        var posDecay = 1 - Math.pow(inversePosVal, self.descSettings.posDecayWeight);
        var tf = Math.pow(termInfo.termFreq, self.descSettings.tfBoost) * posDecay;

        var idf = 0;
        if (termInfo.docFreq < self.resultSettings.maxDocFreq) {
            var df = logBase(termInfo.docFreq, self.resultSettings.maxDocFreq);
            idf = 1 - Math.pow(df, self.descSettings.dfWeight);
        }

        var tfIdf = tf * idf;

        results.push({
            term: termInfo.term,
            desc: {
                termFreq: termInfo.termFreq,
                position: termInfo.positions[0],
                posDecay: posDecay,
                tf: tf,
                docFreq: termInfo.docFreq,
                idf: idf,
                tfIdf: tfIdf
            }
        });
    });

    return results;
};

TermMatrix.prototype.getTopScoringTerms = function(doc) {
    var self = this;

    var results = [];

    var titleTermScoresMap = self.getTitleTermScoresMap(doc.name);
    var descTermScores = self.getDescTermScores(doc.desc);

    descTermScores.forEach(function(termScore) {
        var termScoreEntry = titleTermScoresMap[termScore.term];

        if (!termScoreEntry) {
            termScoreEntry = termScore;
            termScoreEntry.tfIdf = termScore.desc.tfIdf;
        } else {
            termScoreEntry.desc = termScore.desc;
            var maxTfIdf = Math.max(termScoreEntry.title.tfIdf, termScore.desc.tfIdf);
            var minTfIdf = Math.min(termScoreEntry.title.tfIdf, termScore.desc.tfIdf);
            termScoreEntry.tfIdf = maxTfIdf + (minTfIdf * self.resultSettings.tieBreak);
            delete titleTermScoresMap[termScore.term];
        }

        results.push(termScoreEntry);
    });

    Object.keys(titleTermScoresMap).forEach(function(key) {
        var termScoreEntry = titleTermScoresMap[key];
        termScoreEntry.tfIdf = termScoreEntry.title.tfIdf;
        results.push(termScoreEntry);
    });

    if (results.length === 0) {
        return results;
    }

    results.sort(function(a, b) {
        return b.tfIdf - a.tfIdf;
    });

    results = results.splice(0, self.resultSettings.maxTerms);

    var topScore = Math.pow(results[0].tfIdf, self.resultSettings.smoothFactor);

    results.forEach(function(result) {
        result.score = Math.pow(result.tfIdf, self.resultSettings.smoothFactor) / topScore;
    });

    return results;
};

TermMatrix.prototype.buildTermMatrix = function() {
    var self = this;

    log.debug("Term matrix size: " + self.indexedTermMatrix.length + " x " + self.termIndex);

    self.indexedTermMatrix.forEach(function(indexedTermVector) {
        for (var i = 0; i < self.termIndex; i++) {
            if (!indexedTermVector[i]) {
                indexedTermVector[i] = 0;
            }
        }
    });

    return self.indexedTermMatrix;
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