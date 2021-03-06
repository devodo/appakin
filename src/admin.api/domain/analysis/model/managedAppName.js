'use strict';

var log = require('../../../logger');
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
    var result= similarity.similar(this.originalAppName, other.originalAppName);

    //return similarity.similar(this.compactAppName, other.compactAppName) ||
    //       similarity.similar(this.noDeveloperCompactAppName, other.noDeveloperCompactAppName);

    return result;
};

ManagedAppName.prototype.adjustNormalisedNamesBasedOnOriginalAppName = function(originalManagedAppName) {
    if (this.compactAppNameRemade === originalManagedAppName.compactAppNameRemade) {
        //similarity.similar(this.compactAppNameRemade, originalManagedAppName.compactAppNameRemade)) {
        this.compactAppName = '';
        this.compactAppNameTokens = [];
        this.compactAppNameRemade = '';
    }

    if (this.noDeveloperCompactAppNameRemade === originalManagedAppName.noDeveloperCompactAppNameRemade) {
        //similarity.similar(this.noDeveloperCompactAppNameRemade, originalManagedAppName.noDeveloperCompactAppNameRemade)) {
        this.noDeveloperCompactAppName = '';
        this.noDeveloperCompactAppNameTokens = [];
        this.noDeveloperCompactAppNameRemade = '';
    }
};

ManagedAppName.prototype.matches = function(sentence, matchOnWholeSentence) {
    var sentenceForComparisonLetterCount = this.compactAppNameRemade.length;

    var sentenceForComparison = tokenisation.createStringFromTokens(
        sentence.getTokens(),
        matchOnWholeSentence ? null : sentenceForComparisonLetterCount);

    //log.warn('match 1: [' + sentenceForComparison + '] [' + this.compactAppNameRemade + ']');

    if (this.compactAppNameRemade && similarity.similar(sentenceForComparison, this.compactAppNameRemade)) {
        return true;
    }

    if (!matchOnWholeSentence && this.noDeveloperCompactAppName.length !== sentenceForComparisonLetterCount) {
        sentenceForComparisonLetterCount = this.noDeveloperCompactAppName.length;

        sentenceForComparison = tokenisation.createStringFromTokens(
            sentence.getTokens(),
            sentenceForComparisonLetterCount);
    }

    //log.warn('match 2: [' + sentenceForComparison + '] [' + this.noDeveloperCompactAppNameRemade + ']');

    if (this.noDeveloperCompactAppNameRemade && similarity.similar(sentenceForComparison, this.noDeveloperCompactAppNameRemade)) {
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
    if (!developerName) {
        return compactAppName;
    }

    var newAppName = patternMatching.removeDeveloperName(compactAppName, developerName);
    newAppName = patternMatching.removeAppTypeSuffix(newAppName);
    return newAppName;
}

exports.createManagedAppName = createManagedAppName;
