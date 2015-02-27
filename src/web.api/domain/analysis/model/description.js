'use strict';

function Description(paragraphs) {
    this.paragraphs = paragraphs || [];
}

Description.prototype.forEachActiveParagraph = function(callback) {
    for (var i = 0; i < this.paragraphs.length; ++i) {
        var paragraph = this.paragraphs[i];
        if (paragraph.isRemoved) {
            continue;
        }

        var result = callback(paragraph, i);
        if (result) {
            break;
        }
    }
};

Description.prototype.getResult = function() {
    var result = '';

    for (var i = 0; i < this.paragraphs.length; ++i) {
        var paragraphContent = this.paragraphs[i].getResult();

        if (paragraphContent) {
            result += paragraphContent;
        }
    }

    return result;
};

Description.prototype.getRemovedResult = function() {
    var result = '';

    for (var i = 0; i < this.paragraphs.length; ++i) {
        var paragraphContent = this.paragraphs[i].getRemovedResult();

        if (paragraphContent) {
            result += paragraphContent;
        }
    }

    return result;
};

exports.Description = Description;
