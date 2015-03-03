'use strict';

function RemovalReason() {
    this.removalReason = null;
    this.soundness = 0;
}

RemovalReason.prototype.add = function(reason, soundness) {
    this.removalReason = this.removalReason ? this.removalReason + ', ' + reason : reason;
    this.soundness = Math.max(this.soundness, soundness);
};

RemovalReason.prototype.getAttributeText = function() {
    return this.removalReason ? ' title="' + this.removalReason + '"' : '';
};

RemovalReason.prototype.getInlineText = function() {
    return this.removalReason ? '[[' + this.removalReason + ']] ' : '';
};

exports.RemovalReason = RemovalReason;
