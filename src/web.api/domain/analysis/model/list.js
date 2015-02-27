'use strict';

function List(listItems) {
    this.listItems = listItems || [];
    this.isRemoved = false;
    this.removalReason = null;
}

List.prototype.markAsRemoved = function(reason) {
    this.isRemoved = true;
    this.removalReason = reason;
};

List.prototype.getSentenceCount = function() {
    var sentenceCount = 0;

    for (var i = 0; i < this.listItems.length; ++i) {
        sentenceCount += this.listItems[i].getSentenceCount();
    }

    return sentenceCount;
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

    return (this.removalReason ? '<<' + this.removalReason + '>> ' : '') + result;
};

exports.List = List;
