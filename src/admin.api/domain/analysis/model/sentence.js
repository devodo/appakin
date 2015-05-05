'use strict';

var RemovalReason = require('./removalReason').RemovalReason;
var tokenisation = require('../tokenisation');

function Sentence(content, isPossibleHeading) {
    this.content = content || '';
    this._tokens = null; // lazy loaded.
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
    this.lengthPercentageRelativeToParagraph = null;
    this.isPossibleHeading = isPossibleHeading;
}

Sentence.prototype.setLengthPercentageRelativeToParagraph = function(paragraphLength) {
    var sentenceLength = this.getLength();
    var totalLength = Math.max(paragraphLength, sentenceLength);
    this.lengthPercentageRelativeToParagraph = totalLength === 0 ? 0 : (100.0 / totalLength) * sentenceLength;
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
