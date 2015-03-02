'use strict';

var natural = require('natural');
var similarity = require('../similarity');
var tokenisation = require('../tokenisation');

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

ManagedAppName.prototype.matches = function(sentence) {
    var sentenceForComparison = tokenisation.createStringFromTokens(
        sentence.getTokens(),
        this.compactAppNameTokens.length);

    if (similarity.similar(sentenceForComparison, this.compactAppNameRemade)) {
        return true;
    }

    if (this.noDeveloperCompactAppNameTokens.length !== this.compactAppNameTokens.length) {
        sentenceForComparison = tokenisation.createStringFromTokens(
            sentence.getTokens(),
            this.noDeveloperCompactAppNameTokens.length);
    }

    return similarity.similar(sentenceForComparison, this.noDeveloperCompactAppNameRemade);
};

// -----------------------

function createManagedAppName(appName, developerName) {
    var compactAppName = createCompactAppName(appName);
    var noDeveloperCompactAppName = createNoDeveloperCompactAppName(appName, developerName);
    return new ManagedAppName(appName, compactAppName, noDeveloperCompactAppName);
}

// -----------------------

function createCompactAppName(appName) {
    var newAppName = removeParenthesesAtEnd(appName);
    newAppName = removeAppTypeSuffix(newAppName);
    return newAppName;
}

function createNoDeveloperCompactAppName(compactAppName, developerName) {
    var result = removeDeveloperName(compactAppName, developerName);
    // could try removing type suffix here.
    return result;
}

var escapeForRegexRegex = /[-\/\\^$*+?.()|[\]{}]/g;

var escapeForRegex = function (value) {
    return value.replace(escapeForRegexRegex, '\\$&');
};

var removeParenthesesAtEndRegex = /\(.+\)$/i;

function removeParenthesesAtEnd(appName) {
    var result = appName.replace(removeParenthesesAtEndRegex, '').trim();
    return result === '' ? appName : result;
}

var removeAppTypeSuffixRegex = /(free|lite|hd|for (the )?ipad( \d|\d)?|for (the )?iphone( \d|\d)?|ipad version|iphone version)\s*\W*$/i;

function removeAppTypeSuffix(appName) {
    var result = appName.replace(removeAppTypeSuffixRegex, '').trim();

    if (result.length < appName.length) {
        // remove non alphanum letters from end
        result = result.replace(/[^\w]*$/, '').trim();
    }

    return result === '' ? appName : result;
}

function removeDeveloperName(appName, developerName) {
    var normalisedDeveloperName = normaliseDeveloperName(developerName);

    // try to remove developer name from start of app name.

    function createStartOfAppNameRegex(input) {
        return new RegExp('^' + escapeForRegex(input) + '[®™\u00A9\u24B8\u24D2]?([-\u2013\u2014\u2015\u2016:,\\.]|\\s|\'s)\\s*', 'i');
    }

    var devNameAtStartOfAppNameRegex = createStartOfAppNameRegex(developerName);
    var normalisedDevNameAtStartOfAppNameRegex = createStartOfAppNameRegex(normalisedDeveloperName);
    var removedFromStartOfAppName = false;

    var cleanedAppName = appName.replace(devNameAtStartOfAppNameRegex, '');
    if (cleanedAppName.length < appName.length) {
        removedFromStartOfAppName = true;
    } else {
        cleanedAppName = appName.replace(normalisedDevNameAtStartOfAppNameRegex, '');
        if (cleanedAppName.length < appName.length) {
            removedFromStartOfAppName = true;
        }
    }

    // remove non alphanum letters from start
    cleanedAppName = cleanedAppName.replace(/^[^\w]*/, '').trim();
    if (cleanedAppName === '') {
        return appName;
    }

    // return result if developer name was removed from start of app name.
    if (removedFromStartOfAppName) {
        return cleanedAppName;
    }

    // try to remove developer name from end of app name.

    function createEndOfAppNameRegex(input) {
        return new RegExp('[^\\w]?(\\s*(\\ba|\\ban|\\bby|\\bfrom|[-\u2013\u2014\u2015\u2016:,\\.\\(])|\\s)\\s*' + escapeForRegex(input) + '.*$', 'i');
    }

    var devNameAtEndOfAppNameRegex = createEndOfAppNameRegex(developerName);
    var normalisedDevNameAtEndOfAppNameRegex = createEndOfAppNameRegex(normalisedDeveloperName);
    var removedFromEndOfAppName =false;

    cleanedAppName = appName.replace(devNameAtEndOfAppNameRegex, '');
    if (cleanedAppName.length < appName.length) {
        removedFromEndOfAppName = true;
    } else {
        cleanedAppName = appName.replace(normalisedDevNameAtEndOfAppNameRegex, '');
        if (cleanedAppName.length < appName.length) {
            removedFromEndOfAppName = true;
        }
    }

    // remove non alphanum letters from end
    cleanedAppName = cleanedAppName.replace(/[^\w]*$/, '').trim();
    if (cleanedAppName === '') {
        return appName;
    }

    // return result if developer name was removed from end of app name.
    if (removedFromEndOfAppName) {
        return cleanedAppName;
    }

    return appName;
}

var companyNameSuffixRegex = /,?\s*(ltd\.?|llc\.?)$/i;

function normaliseDeveloperName(developerName) {
    developerName = developerName.replace(companyNameSuffixRegex, '');
    return developerName;
}

exports.normaliseDeveloperName = normaliseDeveloperName;
exports.removeDeveloperName = removeDeveloperName;
exports.removeAppTypeSuffix = removeAppTypeSuffix;
exports.removeParenthesesAtEnd = removeParenthesesAtEnd;
exports.createManagedAppName = createManagedAppName;
