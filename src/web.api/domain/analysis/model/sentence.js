'use strict';

var RemovalReason = require('./removalReason').RemovalReason;
var tokenisation = require('../tokenisation');

function Sentence(content) {
    this.content = content || '';
    this._tokens = null; // lazy loaded.
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
    this.tokenPercentageRelativeToParagraph = null;
}

Sentence.prototype.setTokenPercentageRelativeToParagraph = function(paragraphTokenCount) {
    var sentenceTokenCount = this.getTokenCount();
    var totalTokenCount = Math.max(paragraphTokenCount, sentenceTokenCount);
    this.tokenPercentageRelativeToParagraph = totalTokenCount === 0 ? 0 : (100.0 / totalTokenCount) * sentenceTokenCount;
};

Sentence.prototype.markAsRemoved = function(reason, soundness) {
    this.isRemoved = true;
    this.removalReason.add(reason, soundness);
};

Sentence.prototype.conditionallyMarkAsRemoved = function(regex, reason, soundness) {
    var testResult = regex.test(this.content);

    if (testResult) {
        this.isRemoved = true;
        this.removalReason.add(reason, soundness);
    }
};

Sentence.prototype.getLength = function() {
    return this.content.length;
};

Sentence.prototype.getTokenCount = function() {
    return this.getTokens().length;
};

Sentence.prototype.getTokens = function() {
    if (this._tokens === null) {
        this._tokens = tokenisation.tokenise(this.content);
    }

    return this._tokens;
};

Sentence.prototype.getResult = function() {
    return this.isRemoved ? '' : this.content;
};

Sentence.prototype.getRemovedResult = function(force) {
    return !this.isRemoved && !force ? '' : this.removalReason.getInlineText() + this.content;
};

Sentence.prototype.getHtmlResult = function() {
    if (this.isRemoved) {
        return '<span class="removed"' + this.removalReason.getAttributeText() + '>' + this.content + '</span>';
    } else {
        return this.content;
    }
};

exports.Sentence = Sentence;
