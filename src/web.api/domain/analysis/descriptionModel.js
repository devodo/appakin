'use strict';

// ----------------------
// Description class
// ----------------------

function Description(paragraphs) {
    this.paragraphs = paragraphs || [];
}

exports.CreateDescription = function(paragraphs) {
    return new Description(paragraphs);
};

/*
 Description.prototype.getParagraphsCount = function() {
 return this.paragraphs.length;
 };

 Description.prototype.getParagraph = function(index) {
 if (index >= this.paragraphs.length) {
 return null;
 }

 return this.paragraphs[index];
 };
 */

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
        result += this.paragraphs[i].getResult();
    }

    return result;
};

// ----------------------
// Paragraph class
// ----------------------

function Paragraph(lines, containsList) {
    this.lines = lines || [];
    this.containsList = containsList || false;
    this.isRemoved = false;
}

exports.CreateParagraph = function(lines, containsList) {
    return new Paragraph(lines, containsList);
};

Paragraph.prototype.markAsRemoved = function() {
    this.isRemoved = true;
};

Paragraph.prototype.getLinesCount = function() {
    return this.lines.length;
};

Paragraph.prototype.getLine = function(index) {
    if (index >= this.lines.length) {
        return null;
    }

    return this.lines[index];
};

Paragraph.prototype.forEachActiveLine = function(includeListItems, callback) {
    for (var i = 0; i < this.lines.length; ++i) {
        var line = this.lines[i];

        if (line.isRemoved || (!includeListItems && line.isListItem)) {
            continue;
        }

        var result = callback(line, i);
        if (result) {
            break;
        }
    }
};

Paragraph.prototype.forEachLine = function(includeListItems, callback) {
    for (var i = 0; i < this.lines.length; ++i) {
        var line = this.lines[i];

        if (!includeListItems && line.isListItem) {
            continue;
        }

        var result = callback(line, i);
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

    for (var i = 0; i < this.lines.length; ++i) {
        result += this.lines[i].getResult();
    }

    return result;
};

// ----------------------
// Line class
// ----------------------

function Line(content, isListItem, bulletContent) {
    this.content = content || '';
    this.isListItem = isListItem || false;
    this.bulletContent = bulletContent;
    this.isRemoved = false;
}

exports.CreateLine = function(content, isListItem, bulletContent) {
    return new Line(content, isListItem, bulletContent);
};

Line.prototype.markAsRemoved = function() {
    this.isRemoved = true;
};

Line.prototype.getResult = function() {
    if (this.isRemoved) {
        return '';
    }

    if (this.isListItem) {
        return this.bulletContent + ' ' + this.content + ' ';
    } else {
        return this.content + ' ';
    }
};
