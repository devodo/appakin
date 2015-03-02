'use strict';

var nlpCompromise = require('nlp_compromise');
var RemovalReason = require('./removalReason').RemovalReason;

function Sentence(content) {
    this.content = content || '';
    this._tokens = null; // lazy loaded.
    this.isRemoved = false;
    this.removalReason = new RemovalReason();
}

Sentence.prototype.markAsRemoved = function(reason) {
    this.isRemoved = true;
    this.removalReason.add(reason);
};

Sentence.prototype.conditionallyMarkAsRemoved = function(regex, reason) {
    var testResult = regex.test(this.content);

    if (testResult) {
        this.isRemoved = true;
        this.removalReason.add(reason);
    }
};

Sentence.prototype.getLength = function() {
    return this.content.length;
};

Sentence.prototype.getTokenCount = function() {
    return this.tokens.length;
};

Sentence.prototype.getTokens = function() {
    if (this._tokens === null) {
        this._tokens = nlpCompromise.tokenize(this.content)[0].tokens;
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
