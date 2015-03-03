'use strict';

var List = require('./list').List;
var RemovalReason = require('./removalReason').RemovalReason;

// ----------------------
// Paragraph class
// ----------------------

function Paragraph(elements) {
    this.elements = elements || [];
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
    this.locationPercentageRelativeToDescription = null;
}

Paragraph.prototype.setStatistics = function(descriptionTokenCount, priorTokenCount) {
    var paragraphTokenCount = 0;

    this.forEachSentence(true, function(sentence) {
        paragraphTokenCount += sentence.getTokenCount();
    });

    this.forEachSentence(true, function(sentence) {
        sentence.setTokenPercentageRelativeToParagraph(paragraphTokenCount);
    });

    this.locationPercentageRelativeToDescription = descriptionTokenCount === 0 ? 0 : (100.0 / descriptionTokenCount) * priorTokenCount;

    return paragraphTokenCount;
};

Paragraph.prototype.markAsRemoved = function(reason, soundness) {
    this.isRemoved = true;
    this.removalReason.add(reason, soundness);
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

Paragraph.prototype.getFirstSentence = function() {
    var firstElement = this.getElement(0);
    if (!firstElement) {
        return null;
    }

    return firstElement.getFirstSentence();
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

Paragraph.prototype.forEachActiveList = function(callback) {
    if (this.isRemoved) {
        return;
    }

    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];

        if (element instanceof List && !element.isRemoved) {
            var result = callback(element);
            if (result) {
                break;
            }
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

    return result ? this.removalReason.getInlineText() + result + '\n' : result;
};

Paragraph.prototype.getHtmlResult = function() {
    var content = '';

    for (var i = 0; i < this.elements.length; ++i) {
        var element = this.elements[i];
        content += element.getHtmlResult();
    }

    if (this.isRemoved) {
        return '<span class="removed"' + this.removalReason.getAttributeText() + '>' + content + '</span>\n';
    } else {
        return content + '\n';
    }
};

exports.Paragraph = Paragraph;
