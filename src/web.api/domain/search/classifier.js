'use strict';

var fs = require('fs');
var config = require('../../config');
var log = require('../../logger');

var Classifier = function() {
    var nodesvm = require('node-svm');
    this.svm = new nodesvm.CSVC({ // classification
        kernelType: nodesvm.KernelTypes.RBF,
        gamma: [0.03125],
        C: [8],
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

// Maths
//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiIxLShsb2coeCkvbG9nKDIyMCkpXjIqMC45IiwiY29sb3IiOiIjRTYyNTI1In0seyJ0eXBlIjowLCJlcSI6IjEtKGxvZyh4KS9sb2coMzAwKSleMjAiLCJjb2xvciI6IiMxNDVBRDEifSx7InR5cGUiOjAsImVxIjoiKGxuKHgpL2xuKDI4NDIxMDgpKSIsImNvbG9yIjoiIzI1RTMwQyJ9LHsidHlwZSI6MCwiZXEiOiJ4XjAuNSIsImNvbG9yIjoiIzAwMDAwMCJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIi0zMDkuNzg5NTUwNzgxMjQ5ODMiLCI2MDguNzg5NTUwNzgxMjQ5OCIsIi03LjE1NTI3MzQzNzQ5OTk5NjQiLCIxMS4xNTUyNzM0Mzc0OTk5OTYiXX1d
var ClassifierAnalyser = function(termScores) {
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
        posDecay: 0.1,
        dfWeight: 2.5,
        titleBoost: 1.0
    };

    var descSettings = {
        minDocFreq: 5,
        minTermLength: 1,
        tfBoost: 0.5,
        minPosLength: 20,
        posDecayWeight: 25,
        dfWeight: 2.5
    };

    this.termMatrix = new TermMatrix(resultSettings, titleSettings, descSettings, termScores);
    this.docMap = Object.create(null);
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

ClassifierAnalyser.prototype.getTopTerms = function(limit) {
    var self = this;
    var result = self.termMatrix.getTopTerms(limit);

    return result;
};

ClassifierAnalyser.prototype.getDocTopTerms = function(doc) {
    var self = this;
    var result = self.termMatrix.getTopScoringTerms(doc);

    return result;
};

var TrainingAnalyser = function() {
    this.settings = {
        minDocFreq: 3,
        maxDocFreq: 800000,
        dfWeight: 2
    };

    this.nameTermDictionary = Object.create(null);
    this.descTermDictionary = Object.create(null);
    this.includeDocCount = 0;
    this.excludeDocCount = 0;
};

var addTermInfos = function(termInfos, termDictionary, isInclude) {
    var self = this;

    termInfos.forEach(function(termInfo) {
        if (containsStopWord(termInfo.term)) {
            return;
        }

        var existingItem = termDictionary[termInfo.term];

        if (!existingItem) {
            existingItem = {
                includeFreq: 0,
                excludeFreq: 0,
                docFreq: termInfo.docFreq
            };

            termDictionary[termInfo.term] = existingItem;
        }

        if (isInclude) {
            existingItem.includeFreq++;
        }
        else {
            existingItem.excludeFreq++;
        }
    });
};

TrainingAnalyser.prototype.addTrainingDocs = function(trainingDocs) {
    var self = this;

    trainingDocs.forEach(function(trainingDoc) {
        if (trainingDoc.include) {
            self.includeDocCount++;
        }
        else {
            self.excludeDocCount++;
        }

        addTermInfos(trainingDoc.name, self.nameTermDictionary, trainingDoc.include);
        addTermInfos(trainingDoc.desc, self.descTermDictionary, trainingDoc.include);
    });
};

TrainingAnalyser.prototype.calculateTermScores = function(termDictionary) {
    var self = this;

    var termScores = [];

    Object.keys(termDictionary).forEach(function(key) {
        var termInfo = termDictionary[key];

        if (termInfo.docFreq < self.settings.minDocFreq) {
            return;
        }

        if (termInfo.docFreq >= self.settings.maxDocFreq) {
            return;
        }

        var calculateTf = function(freq, docCount) {
            if (freq === 0 || docCount === 0) {
                return 0;
            }

            var tf = logBase(freq + 1, docCount + 1);
            return tf;
        };

        var includeTf = calculateTf(termInfo.includeFreq, self.includeDocCount);
        var excludeTf = calculateTf(termInfo.excludeFreq, self.excludeDocCount);

        var df = logBase(termInfo.docFreq, self.settings.maxDocFreq);
        var idf = 1 - Math.pow(df, self.settings.dfWeight);

        var maxTf = Math.max(includeTf, excludeTf);
        var score = maxTf * idf;

        termScores.push({
            term: key,
            score: score
        });
    });

    termScores.sort(function(a, b) {
        return b.score - a.score;
    });

    return termScores;
};

TrainingAnalyser.prototype.analyseTermScores = function() {
    var self = this;

    var nameTermScores = self.calculateTermScores(self.nameTermDictionary);
    var descTermScores = self.calculateTermScores(self.descTermDictionary);

    return {
        name: nameTermScores,
        desc: descTermScores
    };
};

var TermMatrix = function(resultSettings, titleSettings, descSettings, termScores) {
    var self = this;

    self.resultSettings = resultSettings;
    self.titleSettings = titleSettings;
    self.descSettings = descSettings;

    self.termDictionary = Object.create(null);
    self.termIndex = 0;
    self.indexedTermMatrix = [];

    self.titleTermScoreMap = Object.create(null);
    self.descTermScoreMap = Object.create(null);

    termScores.name.forEach(function(termScore) {
        self.titleTermScoreMap[termScore.term] = termScore.score;
    });

    termScores.desc.forEach(function(termScore) {
        self.descTermScoreMap[termScore.term] = termScore.score;
    });
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

TermMatrix.prototype.getTitleScoresMap = function(termInfos) {
    var self = this;

    var results = Object.create(null);

    termInfos.forEach(function(termInfo) {
        var termScore = self.titleTermScoreMap[termInfo.term];

        if (!termScore) {
            return;
        }

        var posDecay = 1 / Math.pow(termInfo.positions[0] + 1, self.titleSettings.posDecay);
        var tf = Math.pow(termInfo.termFreq, self.titleSettings.tfBoost);

        var tfIdf = Math.pow(tf * termScore * posDecay, self.titleSettings.titleBoost);

        results[termInfo.term] = {
            term: termInfo.term,
            title: {
                termFreq: termInfo.termFreq,
                position: termInfo.positions[0],
                posDecay: posDecay,
                tf: tf,
                docFreq: termInfo.docFreq,
                idf: termScore,
                tfIdf: tfIdf
            }
        };
    });

    return results;
};

TermMatrix.prototype.getDescScores = function(termInfos) {
    var self = this;

    var results = [];

    var lastPosition = 0;

    termInfos.forEach(function(termInfo) {
        var pos = termInfo.positions[termInfo.positions.length - 1];
        if (pos > lastPosition) {
            lastPosition = pos;
        }
    });

    lastPosition = Math.max(lastPosition, self.descSettings.minPosLength);

    termInfos.forEach(function(termInfo) {
        var termScore = self.descTermScoreMap[termInfo.term];

        if (!termScore) {
            return;
        }

        var inversePosVal = logBase(termInfo.positions[0] + 1, (lastPosition + 1));
        var posDecay = 1 - Math.pow(inversePosVal, self.descSettings.posDecayWeight);
        var tf = Math.pow(termInfo.termFreq, self.descSettings.tfBoost);

        var tfIdf = tf * termScore * posDecay;

        results.push({
            term: termInfo.term,
            desc: {
                termFreq: termInfo.termFreq,
                position: termInfo.positions[0],
                posDecay: posDecay,
                tf: tf,
                docFreq: termInfo.docFreq,
                idf: termScore,
                tfIdf: tfIdf
            }
        });
    });

    return results;
};

TermMatrix.prototype.getTitleTermScoresMap = function(titleTermVector) {
    var self = this;

    var results = Object.create(null);

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

        var posDecay = 1 / Math.pow(termInfo.positions[0] + 1, self.titleSettings.posDecay);
        var tf = Math.pow(termInfo.termFreq, self.titleSettings.tfBoost);

        var idf = 0;
        if (termInfo.docFreq < self.resultSettings.maxDocFreq) {
            var df = logBase(termInfo.docFreq, self.resultSettings.maxDocFreq);
            idf = 1 - Math.pow(df, self.titleSettings.dfWeight);
        }

        var tfIdf = Math.pow(tf * idf * posDecay, self.titleSettings.titleBoost);

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

    lastPosition = Math.max(lastPosition, self.descSettings.minPosLength);

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

        var inversePosVal = logBase(termInfo.positions[0] + 1, (lastPosition + 1));
        var posDecay = 1 - Math.pow(inversePosVal, self.descSettings.posDecayWeight);
        var tf = Math.pow(termInfo.termFreq, self.descSettings.tfBoost);

        var idf = 0;
        if (termInfo.docFreq < self.resultSettings.maxDocFreq) {
            var df = logBase(termInfo.docFreq, self.resultSettings.maxDocFreq);
            idf = 1 - Math.pow(df, self.descSettings.dfWeight);
        }

        var tfIdf = tf * idf * posDecay;

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

    var titleTermScoresMap = self.getTitleScoresMap(doc.name);
    var descTermScores = self.getDescScores(doc.desc);

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

    for (var j = 0; j < self.indexedTermMatrix.length; j++) {
        for (var i = 0; i < self.termIndex; i++) {
            if (!self.indexedTermMatrix[j][i]) {
                self.indexedTermMatrix[j][i] = 0;
            }
        }
    }

    log.debug("Vector matrix filling complete");

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
        stopwords = Object.create(null);
        var contents = fs.readFileSync(config.search.stopwordFile).toString();
        var lines = contents.replace(/\r/g, '').split(/\n/g);
        lines.forEach(function(line) {
            if (line.match(/^\s*#/)) { return; } // ignore commented lines
            stopwords[line] = true;
        });
    }

    return stopwords[word];
};

var containsStopWord = function(termsString) {
    var words = termsString.split(' ');

    for (var i = 0; i < words.length; i++) {
        if (isStopWord(words[i])) {
            return true;
        }
    }

    return false;
};

exports.createClassifierAnalyser = function(termScores) {
    return new ClassifierAnalyser(termScores);
};

exports.createTrainingAnalyser = function() {
    return new TrainingAnalyser();
};

exports.createClassifier = function() {
    return new Classifier();
};