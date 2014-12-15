'use strict';

var fs = require('fs');
var config = require('../../config');
var log = require('../../logger');

var Classifier = function() {
    var nodesvm = require('node-svm');
    this.svm = new nodesvm.CSVC({ // classification
        kernelType: nodesvm.KernelTypes.RBF,
        gamma: [0.125],
        C: [2],
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

Classifier.prototype.predict = function(vector) {
    return this.svm.predict(vector);
};

// Maths
//http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiIxLShsb2coeCkvbG9nKDIyMCkpXjIqMC45IiwiY29sb3IiOiIjRTYyNTI1In0seyJ0eXBlIjowLCJlcSI6IjEtKGxvZyh4KS9sb2coMzAwKSleMjAiLCJjb2xvciI6IiMxNDVBRDEifSx7InR5cGUiOjAsImVxIjoiKGxuKHgpL2xuKDI4NDIxMDgpKSIsImNvbG9yIjoiIzI1RTMwQyJ9LHsidHlwZSI6MCwiZXEiOiJ4XjAuNSIsImNvbG9yIjoiIzAwMDAwMCJ9LHsidHlwZSI6MTAwMCwid2luZG93IjpbIi0zMDkuNzg5NTUwNzgxMjQ5ODMiLCI2MDguNzg5NTUwNzgxMjQ5OCIsIi03LjE1NTI3MzQzNzQ5OTk5NjQiLCIxMS4xNTUyNzM0Mzc0OTk5OTYiXX1d

var TrainingAnalyser = function() {
    this.settings = {
        minDocFreq: 3,
        maxDocFreq: 800000,
        dfWeight: 2,
        trainFreqWeight: 1.0
    };

    this.nameTermDictionary = Object.create(null);
    this.descTermDictionary = Object.create(null);
    this.includeDocCount = 0;
    this.excludeDocCount = 0;
};

var addTermInfos = function(termInfos, termDictionary, isInclude) {
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

            var tf = Math.pow(logBase(freq + 1, docCount + 1), self.settings.trainFreqWeight);
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
            df: termInfo.docFreq,
            idf: idf,
            includeTf: termInfo.includeFreq,
            excludeTf: termInfo.excludeFreq,
            trainingTfScore: maxTf,
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

var ClassifierAnalyser = function() {
    var self = this;

    self.resultSettings = {
        maxTerms: 50,
        maxTrainingTerms: 100,
        smoothFactor: 1.0,
        tieBreak: 0.1,
        maxDocFreq: 800000
    };

    self.titleSettings = {
        tfBoost: 0,
        posDecay: 0.1,
        dfWeight: 2.5,
        titleBoost: 1.0
    };

    self.descSettings = {
        tfBoost: 0.5,
        minPosLength: 20,
        posDecayWeight: 25,
        dfWeight: 2.5
    };

    self.termDictionary = Object.create(null);
    self.termIndex = 0;
    self.trainingMatrix = [];

    self.titleTermScoreMap = Object.create(null);
    self.descTermScoreMap = Object.create(null);
};

ClassifierAnalyser.prototype.initialiseTrainingTermScores = function(trainingDocs) {
    var self = this;

    var trainingAnalyser = new TrainingAnalyser();
    trainingAnalyser.addTrainingDocs(trainingDocs);
    var termScores = trainingAnalyser.analyseTermScores();

    self.titleTermScoreMap = Object.create(null);
    self.descTermScoreMap = Object.create(null);

    termScores.name.forEach(function(termScore) {
        self.titleTermScoreMap[termScore.term] = termScore.score;
    });

    termScores.desc.forEach(function(termScore) {
        self.descTermScoreMap[termScore.term] = termScore.score;
    });
};

ClassifierAnalyser.prototype.addTrainingDocs = function(trainingDocs) {
    var self = this;

    self.initialiseTrainingTermScores(trainingDocs);

    trainingDocs.forEach(function(doc) {
        var termScores = self.getTopScoringTerms(doc, self.resultSettings.maxTrainingTerms);

        var indexedTermVector = [];

        termScores.forEach(function(termScore) {
            var termEntry = self.termDictionary[termScore.term];
            if (!termEntry) {
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

        var trainingRow = [];
        trainingRow[0] = indexedTermVector;
        trainingRow[1] = doc.include ? 1 : 0;
        self.trainingMatrix.push(trainingRow);
    });
};

ClassifierAnalyser.prototype.getTitleScoresMap = function(termInfos) {
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

ClassifierAnalyser.prototype.getDescScores = function(termInfos) {
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

var logBase = function(x,b) {
    return Math.log(x) / Math.log(b);
};

ClassifierAnalyser.prototype.getTermScores = function(doc) {
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

    return results;
};

ClassifierAnalyser.prototype.getTopScoringTerms = function(doc, maxTerms) {
    var self = this;

    if (!maxTerms) {
        maxTerms = self.resultSettings.maxTerms;
    }

    var results = self.getTermScores(doc);

    if (results.length === 0) {
        return results;
    }

    results.sort(function(a, b) {
        return b.tfIdf - a.tfIdf;
    });

    results = results.splice(0, maxTerms);
    var topScore = Math.pow(results[0].tfIdf, self.resultSettings.smoothFactor);

    results.forEach(function(result) {
        result.score = Math.pow(result.tfIdf, self.resultSettings.smoothFactor) / topScore;
    });

    return results;
};

ClassifierAnalyser.prototype.getIndexedTermVector = function(doc) {
    var self = this;

    var termScores = self.getTopScoringTerms(doc);

    var indexedTermVector = [];

    termScores.forEach(function(termScore) {
        var termEntry = self.termDictionary[termScore.term];
        if (termEntry) {
            indexedTermVector[termEntry.index] = termScore.score;
        }
    });

    for (var i = 0; i < self.termIndex; i++) {
        if (!indexedTermVector[i]) {
            indexedTermVector[i] = 0;
        }
    }

    if (indexedTermVector.length === 0) {
        log.warn("Empty term vector for doc:" + doc.id);
    }

    return indexedTermVector;
};

ClassifierAnalyser.prototype.buildTrainingMatrix = function() {
    var self = this;

    log.debug("Term matrix size: " + self.trainingMatrix.length + " x " + self.termIndex);

    for (var j = 0; j < self.trainingMatrix.length; j++) {
        for (var i = 0; i < self.termIndex; i++) {
            if (!self.trainingMatrix[j][0][i]) {
                self.trainingMatrix[j][0][i] = 0;
            }
        }
    }

    log.debug("Vector matrix filling complete");

    return self.trainingMatrix;
};

ClassifierAnalyser.prototype.getTopTerms = function(limit) {
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

exports.createClassifierAnalyser = function() {
    return new ClassifierAnalyser();
};

exports.createTrainingAnalyser = function() {
    return new TrainingAnalyser();
};

exports.createClassifier = function() {
    return new Classifier();
};