'use strict';

/*
A Description consists of a list of Paragraphs.
A Paragraph consists of one or more elements.
An element can be a SentenceGroup or a List.
A SentenceGroup consists of one or more Sentences.
A List consists of one or more ListItems.
A ListItem consists of a SentenceGroup.

A paragraph in a description gets split into elements based on newlines.
For example, a paragraph that consists of three sentences will get represented
as a Paragraph that contains a single element, a SentenceGroup,
which in turn will contain three Sentences.
 */

function Description(paragraphs, managedAppNameList) {
    this.paragraphs = paragraphs || [];
    this.managedAppNameList = managedAppNameList;
}

Description.prototype.forEachParagraph = function(callback) {
    for (var i = 0; i < this.paragraphs.length; ++i) {
        var paragraph = this.paragraphs[i];

        var result = callback(paragraph, i);
        if (result) {
            break;
        }
    }
};

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

Description.prototype.getHtmlResult = function() {
    var result = '';

    for (var i = 0; i < this.paragraphs.length; ++i) {
        var paragraphContent = this.paragraphs[i].getHtmlResult();

        if (paragraphContent) {
            result += paragraphContent;
        }
    }

    return result;
};

exports.Description = Description;
