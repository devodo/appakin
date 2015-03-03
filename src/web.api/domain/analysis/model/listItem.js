'use strict';

var RemovalReason = require('./removalReason').RemovalReason;

function ListItem(sentenceGroup, bullet) {
    this.sentenceGroup = sentenceGroup;
    this.bullet = bullet;
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
}

ListItem.prototype.markAsRemoved = function(reason, soundness) {
    this.isRemoved = true;
    this.removalReason.add(reason, soundness);
};

ListItem.prototype.getSentence = function(index) {
    return this.sentenceGroup.getSentence(index);
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

    return this.removalReason.getInlineText() + this.bullet + ' ' + sentencesResult;
};

ListItem.prototype.getHtmlResult = function() {
    var content = this.sentenceGroup.getHtmlResult();

    if (this.isRemoved) {
        return '<span class="removed"' + this.removalReason.getAttributeText() + '>' + this.bullet + ' ' + content + '</span>';
    } else {
        return this.bullet + ' ' + content;
    }
};

exports.ListItem = ListItem;
