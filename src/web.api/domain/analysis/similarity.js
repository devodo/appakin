'use strict';

var natural = require('natural');

function similar(stringA, stringB) {
    if (Math.abs(stringA.length - stringB.length) > 20) {
        return false;
    }

    return natural.JaroWinklerDistance(stringA, stringB) > 0.8;
}

exports.similar = similar;
