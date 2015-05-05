'use strict';
var slugid = require('slugid');
var slug = require('slug');
var unidecode = require('unidecode');

var MAX_NAME_LENGTH = 25;

var slugifyName = function(name) {
    var decoded = unidecode(name);
    var slugName = slug(decoded);
    var nameLength = Math.min(slugName.length, MAX_NAME_LENGTH);
    var shortName = slugName.substring(0, nameLength).toLowerCase();
    if (shortName[shortName.length - 1] === '-') {
        shortName = shortName.substring(0, shortName.length - 1);
    }

    return shortName;
};

exports.slugifyName = slugifyName;

exports.makeUrl = function(extId, name) {
    var sId = slugid.encode(extId);
    var slugName = slugifyName(name);

    return sId + '/' + slugName;
};

exports.decodeId = function(encodedId) {
    var uuid = slugid.decode(encodedId);

    if (uuid.length !== 36) {
        uuid = null;
    }

    return uuid;
};








