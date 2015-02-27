'use strict';

var List = require('./list').List;

// ----------------------
// Paragraph class
// ----------------------

function Paragraph(elements) {
    this.elements = elements || [];
    this.isRemoved = false;
    this.removalReason = null;
}

Paragraph.prototype.markAsRemoved = function(reason) {
    this.isRemoved = true;
    this.removalReason = reason;
};

Paragraph.prototype.getSentenceCount = function() {
    var sentenceCount = 0;

    for (var i = 0; i < this.elements.length; ++i) {
        sentenceCount += this.elements[i].getSentenceCount();
    }

    return sentenceCount;
};

Paragraph.prototype.getElementCount = function() {
    return this.elements.length;
};

Paragraph.prototype.getElement = function(index) {
    if (index >= this.elements.length) {
        return null;
    }

    return this.elements[index];
};

Paragraph.prototype.forEachSentence = function(includeLists, callback) {
    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];

        if (!includeLists && element instanceof List) {
            continue;
        }

        var result = element.forEachSentence(callback);
        if (result) {
            break;
        }
    }
};

Paragraph.prototype.forEachActiveSentence = function(includeLists, callback) {
    if (this.isRemoved) {
        return;
    }

    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];

        if (!includeLists && element instanceof List) {
            continue;
        }

        var result = element.forEachActiveSentence(callback);
        if (result) {
            break;
        }
    }
};

Paragraph.prototype.getResult = function() {
    var result = '';

    if (this.isRemoved) {
        return result;
    }

    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];
        result += element.getResult();
    }

    return result + '\n';
};

Paragraph.prototype.getRemovedResult = function() {
    var result = '';

    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];
        result += element.getRemovedResult(this.isRemoved);
    }

    return result ? (this.removalReason ? '<<' + this.removalReason + '>> ' : '') + result + '\n' : result;
};

exports.Paragraph = Paragraph;
