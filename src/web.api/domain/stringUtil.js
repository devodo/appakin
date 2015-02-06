'use strict';

var stripDashes = function(input) {
    if (!input) {
        return null;
    }

    return input.replace(/\-/g, '');
};

var stripUrlsAndEmails = function(input) {
    if (!input) {
        return null;
    }

    var stripRegex = /\b(https?:\/\/|www\.|\S+\.com|\S+@\S+\.)\S*/gi;
    return input.replace(stripRegex, '');
};

var stripSocialMedia = function(input) {
    if (!input) {
        return null;
    }

    var stripRegex = /\b(follow|like)\s+us\s+on\s+(facebook|twitter)/gi;
    return input.replace(stripRegex, '');
};

var stripForIndex = function(input) {
    if (!input) {
        return null;
    }

    return stripUrlsAndEmails(stripSocialMedia(input));
};


exports.stripDashes = stripDashes;
exports.stripUrlsAndEmails = stripUrlsAndEmails;
exports.stripSocialMedia = stripSocialMedia;
exports.stripForIndex = stripForIndex;




