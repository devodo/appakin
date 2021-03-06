'use strict';

var RemovalReason = require('./removalReason').RemovalReason;

function List(listItems) {
    this.listItems = listItems || [];
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
}

List.prototype.getIsPossibleHeading = function() {
    return false;
};

List.prototype.markAsRemoved = function(reason, soundness) {
    this.isRemoved = true;
    this.removalReason.add(reason, soundness);
};

List.prototype.getListItemCount = function() {
    return this.listItems.length;
};

List.prototype.forEachListItem = function(callback) {
    var loopTerminated = false;

    for (var i = 0; i < this.listItems.length; ++i) {
        var listItem = this.listItems[i];

        var result = callback(listItem);
        if (result) {
            loopTerminated = true;
            break;
        }
    }

    return loopTerminated;
};

List.prototype.getSentenceCount = function() {
    var sentenceCount = 0;

    for (var i = 0; i < this.listItems.length; ++i) {
        sentenceCount += this.listItems[i].getSentenceCount();
    }

    return sentenceCount;
};

List.prototype.getFirstSentence = function() {
    if (!this.listItems) {
        return null;
    }

    return this.listItems[0].getSentence(0);
};

List.prototype.forEachSentence = function(callback) {
    var loopTerminated = false;

    for (var i = 0; i < this.listItems.length; ++i) {
        var listItem = this.listItems[i];

        var result = listItem.forEachSentence(callback);
        if (result) {
            loopTerminated = true;
            break;
        }
    }

    return loopTerminated;
};

List.prototype.forEachActiveSentence = function(callback) {
    if (this.isRemoved) {
        return;
    }

    var loopTerminated = false;

    for (var i = 0; i < this.listItems.length; ++i) {
        var listItem = this.listItems[i];

        var result = listItem.forEachActiveSentence(callback);
        if (result) {
            loopTerminated = true;
            break;
        }
    }

    return loopTerminated;
};

List.prototype.getResult = function() {
    if (this.isRemoved) {
        return '';
    }

    var result = '';

    for (var i = 0; i < this.listItems.length; ++i) {
        result += this.listItems[i].getResult();
    }

    return result;
};

List.prototype.getRemovedResult = function(force) {
    var result = '';

    for (var i = 0; i < this.listItems.length; ++i) {
        result += this.listItems[i].getRemovedResult(this.isRemoved || force);
    }

    return this.removalReason.getInlineText() + result;
};

List.prototype.getHtmlResult = function() {
    var content = '';

    for (var i = 0; i < this.listItems.length; ++i) {
        content += this.listItems[i].getHtmlResult();
    }

    if (this.isRemoved) {
        return '<span class="removed"' + this.removalReason.getAttributeText() + '>' + content + '</span>';
    } else {
        return content;
    }
};

exports.List = List;
