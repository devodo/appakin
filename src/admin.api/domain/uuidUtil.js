'use strict';
var validator = require('validator');

var sanitiseUuid = function(uuid) {
    var uuidRegex = /(\w{8})-?(\w{4})-?(\w{4})-?(\w{4})-?(\w{12})/gi;
    var match = uuidRegex.exec(uuid);
    if (!match) {
        return null;
    }

    return match[1] + '-' + match[2] + '-' + match[3] + '-' + match[4] + '-' + match[5];
};

var stripDashes = function(uuid) {
    return uuid.replace(/\-/g, '');
};

var isValid = function(uuid) {
    uuid = sanitiseUuid(uuid);
    if (!uuid) {
        return false;
    }

    return validator.isUUID(uuid);
};

exports.sanitiseUuid = sanitiseUuid;
exports.stripDashes = stripDashes;
exports.isValid = isValid;










