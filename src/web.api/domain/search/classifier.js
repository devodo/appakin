'use strict';

var Classifier = function() {
    var nodesvm = require('node-svm');
    this.svm = new nodesvm.CSVC({ // classification
        kernelType: nodesvm.KernelTypes.RBF,
        //C: 1.0,
        //gamma: 0.5,
        reduce: false,
        normalize: false
    });
};

Classifier.prototype.train = function(trainingData, next) {
    this.svm.train(trainingData, next);
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
    this.titleTermMatrix = new TermMatrix(20, 3, 1, 0, 0.1);
    this.descTermMatrix = new TermMatrix(50, 3, 1, 1.0, 0.1);
    this.docMap = {};
    this.docIndex = [];
};

ClassifierAnalyser.prototype.addDoc = function(doc) {
    var self = this;
    self.titleTermMatrix.addDocTermVector(doc.name);
    self.descTermMatrix.addDocTermVector(doc.desc);
    self.docMap[doc.id] = self.docIndex.length;
    self.docIndex.push(doc.id);
};

ClassifierAnalyser.prototype.buildVectorMatrix = function() {
    var self = this;

    var vectorMatrix = [];
    for (var i = 0; i < self.docIndex.length; i++) {
        vectorMatrix[i] = [];
    }

    var indexOffset = self.titleTermMatrix.buildKeywordMatrix(vectorMatrix, 0);
    self.descTermMatrix.buildKeywordMatrix(vectorMatrix, indexOffset);

    var rowLength = 0;

    vectorMatrix.forEach(function(row) {
        if (rowLength < row.length) {
            rowLength = row.length;
        }
    });

    vectorMatrix.forEach(function(row) {
        for (var j = 0; j < rowLength; j++) {
            if (!row[j]) {
                row[j] = 0;
            }
        }
    });

    return {
        vectorMatrix: vectorMatrix,
        docMap: self.docMap,
        docIndex: self.docIndex
    };
};

ClassifierAnalyser.prototype.getKeywords = function(docId) {
    var self = this;
    var docIndex = self.docMap[docId];
    var titleKeywords = self.titleTermMatrix.getDocKeywords(docIndex);
    var descKeywords = self.descTermMatrix.getDocKeywords(docIndex);

    return {
        title: titleKeywords,
        desc: descKeywords
    };
};

ClassifierAnalyser.prototype.getTopKeywords = function(titleLimit, descLimit) {
    var self = this;
    var titleKeywords = self.titleTermMatrix.getTopKeywords(titleLimit);
    var descKeywords = self.descTermMatrix.getTopKeywords(descLimit);

    return {
        title: titleKeywords,
        desc: descKeywords
    };
};

var TermMatrix = function(maxKeywords, minDocFreq, minTermLength, tfBoost, positionDecay) {
    this.maxKeywords = maxKeywords;
    this.minDocFreq = minDocFreq;
    this.minTermLength = minTermLength;
    this.tfBoost = tfBoost;
    this.positionDecay = positionDecay;

    this.termDictionary = { count: 0 };
    this.docs = [];
};


TermMatrix.prototype.addDocTermVector = function(termVector) {
    var self = this;

    termVector.forEach(function(termInfo) {
        var dictionaryEntry = self.termDictionary[termInfo.term];

        if (!dictionaryEntry) {
            dictionaryEntry = {
                docFreq: 0,
                id: self.termDictionary.count
            };
            self.termDictionary[termInfo.term] = dictionaryEntry;
            self.termDictionary.count++;
        }

        dictionaryEntry.docFreq++;
    });

    this.docs.push(termVector);
};

TermMatrix.prototype.getDocKeywords = function(docIndex) {
    var self = this;
    var termVector = self.docs[docIndex];
    return self.getKeywords(termVector);
};

TermMatrix.prototype.getKeywords = function(termVector) {
    var self = this;

    var keywords = [];

    termVector.forEach(function(termInfo) {
        if (termInfo.term.length < self.minTermLength) {
            return;
        }

        var dictionaryEntry = self.termDictionary[termInfo.term];

        if (!dictionaryEntry) {
            throw "Invalid term dictionary";
        }

        if (dictionaryEntry.docFreq < self.minDocFreq) {
            return;
        }

        var decayFactor = 1 / (Math.pow(termInfo.positions[0] + 1, self.positionDecay));
        var tf = Math.pow(termInfo.termFreq, self.tfBoost) * decayFactor;

        var idf = Math.log(self.docs.length / dictionaryEntry.docFreq) / Math.log(10);
        var tfIdf = tf * idf;

        if (tfIdf <= 0) {
            return;
        }

        keywords.push({
            term: termInfo.term,
            score: tfIdf
        });
    });

    keywords.sort(function(a, b) {
        return b.score - a.score;
    });

    return keywords.splice(0, self.maxKeywords);
};

TermMatrix.prototype.buildKeywordMatrix = function(matrix, indexOffset) {
    var self = this;
    var keywordDictionary = {};

    self.docs.forEach(function(termVector, docIndex) {
        self.getKeywords(termVector).forEach(function(keyword) {
            var dictionaryEntry = keywordDictionary[keyword.term];

            if (!dictionaryEntry) {
                dictionaryEntry = { index: indexOffset++ };
                keywordDictionary[keyword.term] = dictionaryEntry;
            }

            matrix[docIndex][dictionaryEntry.index] = keyword.score;
        });
    });

    return indexOffset;
};

TermMatrix.prototype.getTopKeywords = function(limit) {
    var self = this;
    var keywordDictionary = {};

    self.docs.forEach(function(termVector, docIndex) {
        self.getKeywords(termVector).forEach(function(keyword) {
            var dictionaryEntry = keywordDictionary[keyword.term];

            if (!dictionaryEntry) {
                dictionaryEntry = {
                    term: keyword.term,
                    score: 0.0,
                    freq: 0
                };
                keywordDictionary[keyword.term] = dictionaryEntry;
            }

            dictionaryEntry.freq++;
            dictionaryEntry.score += keyword.score;
        });
    });

    var keys = Object.keys(keywordDictionary);
    var keywords = [keys.length];

    keys.forEach(function(key) {
        keywords.push(keywordDictionary[key]);
    });

    keywords.sort(function(a, b) {
        return b.score - a.score;
    });

    return keywords.splice(0, limit);
};

exports.createClassifierAnalyser = function() {
    return new ClassifierAnalyser();
};

exports.createClassifier = function() {
    return new Classifier();
};