'use strict';

var patternMatching = require('../patternMatching');
var Sentence = require('./sentence').Sentence;

function SentenceGroup(sentences) {
    this.sentences = sentences || [];
}

SentenceGroup.prototype.getIsPossibleHeading = function() {
    return this.sentences.length === 1 && this.sentences[0].isPossibleHeading;
};

SentenceGroup.prototype.getSentenceCount = function() {
    return this.sentences.length;
};

SentenceGroup.prototype.getFirstSentence = function() {
    return this.getSentence(0);
};

// TODO could detect uppercase type of title sentence.
// TODO could detect quotes type of title sentence.
SentenceGroup.prototype.getTitleSentence = function() {
    var result = this.sentences.slice(0, 2).map(function(x) { return x.content; }).join(' ');
    result = patternMatching.removeExtraTextFromStart(result);

    if (result && this.sentences[0].getLength() < 300) {
        return new Sentence(result);
    }

    return null;
};

SentenceGroup.prototype.getSentence = function(index) {
    if (index >= this.sentences.length) {
        return null;
    }

    return this.sentences[index];
};

SentenceGroup.prototype.forEachSentence = function(callback) {
    var loopTerminated = false;

    for (var i = 0; i < this.sentences.length; ++i) {
        var sentence = this.sentences[i];

        var result = callback(sentence);
        if (result) {
            loopTerminated = true;
            break;
        }
    }

    return loopTerminated;
};

SentenceGroup.prototype.forEachActiveSentence = function(callback) {
    var loopTerminated = false;

    for (var i = 0; i < this.sentences.length; ++i) {
        var sentence = this.sentences[i];

        if (sentence.isRemoved) {
            continue;
        }

        var result = callback(sentence);
        if (result) {
            loopTerminated = true;
            break;
        }
    }

    return loopTerminated;
};

SentenceGroup.prototype.getResult = function() {
    return getResultImpl(this.sentences, function(sentence) {
        return sentence.getResult();
    });
};

SentenceGroup.prototype.getRemovedResult = function(force) {
    return getResultImpl(this.sentences, function(sentence) {
        return sentence.getRemovedResult(force);
    });
};

SentenceGroup.prototype.getHtmlResult = function() {
    return getResultImpl(this.sentences, function(sentence) {
        return sentence.getHtmlResult();
    });
};

function getResultImpl(sentences, getSentenceResultCallback) {
    var result = '';

    for (var i = 0; i < sentences.length; ++i) {
        var sentence = sentences[i];
        var sentenceResult = getSentenceResultCallback(sentence);

        if (sentenceResult !== '') {
            if (result !== '') {
                result += ' ';
            }

            result += sentenceResult;
        }
    }

    if (result !== '') {
        result += '\n';
    }

    return result;
}

exports.SentenceGroup = SentenceGroup;
