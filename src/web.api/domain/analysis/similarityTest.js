'use strict';

var natural = require('natural');

function isSimilar(stringA, stringB) {
    //if (stringA.indexOf(stringB) === 0 || stringB.indexOf(stringA) === 0) {
    //    return true;
    //}

    //return natural.LevenshteinDistance(stringA, stringB, {
    //    insertion_cost: 1,
    //    deletion_cost: 1,
    //    substitution_cost: 3
    //}) <= 12;

    if (Math.abs(stringA.length - stringB.length) > 20) {
        return false;
    }

    return natural.JaroWinklerDistance(stringA, stringB) > 0.8;
}

exports.isSimilar = isSimilar;