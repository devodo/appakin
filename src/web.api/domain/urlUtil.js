'use strict';
var slugid = require('slugid');
var slug = require('slug');

var MAX_NAME_LENGTH = 25;

exports.makeUrl = function(extId, name) {
    var sId = slugid.encode(extId);
    var slugName = slug(name);
    var nameLength = Math.min(slugName.length, MAX_NAME_LENGTH);
    var shortName = slugName.substring(0, nameLength).toLowerCase();
    if (shortName[shortName.length - 1] === '-') {
        shortName = shortName.substring(0, shortName.length - 1);
    }

    return sId + '/' + shortName;
};







