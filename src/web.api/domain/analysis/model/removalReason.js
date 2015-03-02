'use strict';

function RemovalReason() {
    this.removalReason = null;
}

RemovalReason.prototype.add = function(reason) {
    this.removalReason = this.removalReason ? this.removalReason + ', ' + reason : reason;
};

RemovalReason.prototype.getAttributeText = function() {
    return this.removalReason ? ' title="' + this.removalReason + '"' : '';
};

RemovalReason.prototype.getInlineText = function() {
    return this.removalReason ? '[[' + this.removalReason + ']] ' : '';
};

exports.RemovalReason = RemovalReason;
