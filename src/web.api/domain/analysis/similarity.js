'use strict';

var natural = require('natural');
var log = require('../../logger');

function similar(stringA, stringB) {
    //log.warn('similar: [' + stringA + '] [' + stringB + ']');

    if (Math.abs(stringA.length - stringB.length) > 20) {
        return false;
    }

    return natural.JaroWinklerDistance(stringA.toLowerCase(), stringB.toLowerCase()) > 0.9;
}

exports.similar = similar;
