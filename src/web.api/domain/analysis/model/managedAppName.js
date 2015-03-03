'use strict';

var natural = require('natural');
var similarity = require('../similarity');
var tokenisation = require('../tokenisation');
var patternMatching = require('../patternMatching');

function ManagedAppName(originalAppName, compactAppName, noDeveloperCompactAppName) {
    this.originalAppName = originalAppName;

    this.compactAppName = compactAppName;
    this.compactAppNameTokens = tokenisation.tokenise(compactAppName);
    this.compactAppNameRemade = tokenisation.createStringFromTokens(this.compactAppNameTokens);

    this.noDeveloperCompactAppName = noDeveloperCompactAppName;
    this.noDeveloperCompactAppNameTokens = tokenisation.tokenise(noDeveloperCompactAppName);
    this.noDeveloperCompactAppNameRemade = tokenisation.createStringFromTokens(this.noDeveloperCompactAppNameTokens);
}

ManagedAppName.prototype.isSimilarTo = function(other) {
    return similarity.similar(this.compactAppName, other.compactAppName) ||
           similarity.similar(this.noDeveloperCompactAppName, other.noDeveloperCompactAppName);
};

ManagedAppName.prototype.matches = function(sentence, matchOnWholeSentence) {
    //var sentenceForComparisonTokenCount = this.compactAppNameTokens.length;
    var sentenceForComparisonLetterCount = this.compactAppNameRemade.length;

    var sentenceForComparison = tokenisation.createStringFromTokens(
        sentence.getTokens(),
        matchOnWholeSentence ? null : sentenceForComparisonLetterCount);

    if (similarity.similar(sentenceForComparison, this.compactAppNameRemade)) {
        return true;
    }

    if (!matchOnWholeSentence && this.noDeveloperCompactAppName.length !== sentenceForComparisonLetterCount) {
        sentenceForComparisonLetterCount = this.noDeveloperCompactAppName.length;

        sentenceForComparison = tokenisation.createStringFromTokens(
            sentence.getTokens(),
            sentenceForComparisonLetterCount);
    }

    if (similarity.similar(sentenceForComparison, this.noDeveloperCompactAppNameRemade)) {
        return true;
    }

    return false;
};


function createManagedAppName(appName, developerName) {
    var compactAppName = createCompactAppName(appName);
    var noDeveloperCompactAppName = createNoDeveloperCompactAppName(compactAppName, developerName);
    return new ManagedAppName(appName, compactAppName, noDeveloperCompactAppName);
}

function createCompactAppName(appName) {
    var newAppName = patternMatching.removeEndParentheses(appName);
    newAppName = patternMatching.removeAppTypeSuffix(newAppName);
    newAppName = patternMatching.getTextTitle(newAppName) || newAppName;
    return newAppName;
}

function createNoDeveloperCompactAppName(compactAppName, developerName) {
    var newAppName = patternMatching.removeDeveloperName(compactAppName, developerName);
    newAppName = patternMatching.removeAppTypeSuffix(newAppName);
    return newAppName;
}

exports.createManagedAppName = createManagedAppName;
