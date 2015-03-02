'use strict';

var nlpCompromise = require('nlp_compromise');

var isAlphaNumRegex = new RegExp('^\\w+$');

function tokenise(input) {
    var sentences = nlpCompromise.tokenize(input);
    var tokens = [];

    for (var i = 0; i < sentences.length; ++i) {
        var sentence = sentences[i];

        for (var j = 0; j < sentence.tokens.length; ++j) {
            var token = sentence.tokens[j];
            if (isAlphaNumRegex.test(token.normalised)) {
                tokens.push(token);
            }
        }
    }

    return tokens;
}

function createStringFromTokens(tokens, maxTokensToUse) {
    tokens = !maxTokensToUse ? tokens : tokens.slice(0, maxTokensToUse);
    return tokens.map(function(x) { return x.normalised; }).join(' ');
}

exports.tokenise = tokenise;
exports.createStringFromTokens = createStringFromTokens;
