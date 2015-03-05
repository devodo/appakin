'use strict';

var nlpCompromise = require('nlp_compromise');
var patternMatching = require('./patternMatching');
var XRegExp = require('xregexp').XRegExp;

function tokenise(input) {
    var sentences = nlpCompromise.tokenize(input);
    var tokens = [];

    for (var i = 0; i < sentences.length; ++i) {
        var sentence = sentences[i];

        for (var j = 0; j < sentence.tokens.length; ++j) {
            var token = sentence.tokens[j];
            if (patternMatching.hasSomeAlphaNumericContent(token.normalised)) {
                tokens.push(token);
            }
        }
    }

    return tokens;
}

function createStringFromTokens(tokens, minLength) {
    if (!minLength) {
        return tokens.map(function(x) { return x.normalised; }).join(' ');
    }

    var result = '';

    for (var i = 0; i < tokens.length; ++i) {
        var token = tokens[i];
        result += (i === 0 ? '' : ' ') + token.normalised;

        if (result.length >= minLength) {
            break;
        }
    }

    return result;
}

// --------------------------------------

exports.tokenise = tokenise;
exports.createStringFromTokens = createStringFromTokens;
