'use strict';

function ListItem(sentenceGroup, bullet) {
    this.sentenceGroup = sentenceGroup;
    this.bullet = bullet;
    this.isRemoved = false;
    this.removalReason = null;
}

ListItem.prototype.markAsRemoved = function(reason) {
    this.isRemoved = true;
    this.removalReason = reason;
};

ListItem.prototype.getSentenceCount = function() {
    return this.sentenceGroup.getSentenceCount();
};

ListItem.prototype.forEachSentence = function(callback) {
    return this.sentenceGroup.forEachSentence(callback);
};

ListItem.prototype.forEachActiveSentence = function(callback) {
    if (this.isRemoved) {
        return;
    }

    return this.sentenceGroup.forEachSentence(callback);
};

ListItem.prototype.getResult = function() {
    if (this.isRemoved) {
        return '';
    }

    var sentencesResult = this.sentenceGroup.getResult();
    if (sentencesResult === '') {
        return '';
    }

    return this.bullet + ' ' + sentencesResult;
};

ListItem.prototype.getRemovedResult = function(force) {
    var sentencesResult = this.sentenceGroup.getRemovedResult(this.isRemoved || force);
    if (sentencesResult === '') {
        return '';
    }

    return (this.removalReason ? '<<' + this.removalReason + '>> ' : '') + this.bullet + ' ' + sentencesResult;
};

exports.ListItem = ListItem;
