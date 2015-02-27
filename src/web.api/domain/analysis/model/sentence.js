'use strict';

var nlpCompromise = require('nlp_compromise');

function Sentence(content) {
    this.content = content || '';
    this.tokens = nlpCompromise.tokenize(content)[0].tokens;
    this.isRemoved = false;
    this.removalReason = null;
}

Sentence.prototype.markAsRemoved = function(reason) {
    this.isRemoved = true;
    this.removalReason = reason;
};

Sentence.prototype.conditionallyMarkAsRemoved = function(regex, reason) {
    this.isRemoved = this.isRemoved || regex.test(this.content);
    this.removalReason = reason;
};

Sentence.prototype.getResult = function() {
    return this.isRemoved ? '' : this.content;
};

Sentence.prototype.getRemovedResult = function(force) {
    return !this.isRemoved && !force ? '' : (this.removalReason ? '<<' + this.removalReason + '>> ' : '') + this.content;
};

exports.Sentence = Sentence;
