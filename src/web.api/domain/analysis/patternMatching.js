'use strict';

var XRegExp = require('xregexp').XRegExp;

// ------------------------------

var removeNonAlphaNumericPrefixRegex = /^[^\w]*/;
var removeNonAlphaNumericSuffixRegex = /[^\w]*$/;

// ------------------------------

var textTitleRegex = new XRegExp('^(.+?)(:\\p{Z}|\\p{Z}:|\\-\\p{Z}|\\p{Z}\\-|\\p{Z}\\u2013|\\u2013\\p{Z}|\\p{Z}\\u2014|\\u2014\\p{Z}|\\p{Z}\\u2015|\\u2015\\p{Z}|\\p{Z}\\u2016|\\u2016\\p{Z})');

function getTextTitle(text) {
    var matches = textTitleRegex.exec(text);
    return matches ? matches[1].trim() : '';
}

// ------------------------------

var hasSomeAlphaNumericContentRegex = new XRegExp('(?:\\p{L}|\\p{Nd})');

function hasSomeAlphaNumericContent(text) {
    return hasSomeAlphaNumericContentRegex.test(text);
}

// ------------------------------

var escapeForInclusionInRegexRegex = /[-\/\\^$*+?.()|[\]{}]/g;

var escapeForInclusionInRegex = function (text) {
    return text.replace(escapeForInclusionInRegexRegex, '\\$&');
};

// ------------------------------

var removeEndParenthesesRegex = /\(.+\)$/;

function removeEndParentheses(text) {
    var result = text.replace(removeEndParenthesesRegex, '').trim();
    return result === '' ? text : result;
}

// ------------------------------

var removeCompanyNameSuffixRegex = /,?\s*(ltd\.?|llc\.?)$/i;

function removeCompanyNameSuffix(text) {
    var result = text.replace(removeCompanyNameSuffixRegex, '').trim();
    return result === '' ? text : result;
}

// ------------------------------

var removeAppTypeSuffixRegex = /(free|lite|hd|for (the )?ipad( \d|\d)?|for (the )?iphone( \d|\d)?|ipad version|iphone version)\s*\W*$/i;

function removeAppTypeSuffix(text) {
    var result = text.replace(removeAppTypeSuffixRegex, '').trim();

    if (result.length < text.length) {
        // remove non alphanum letters from end
        result = result.replace(removeNonAlphaNumericSuffixRegex, '').trim();
    }

    return result === '' ? text : result;
}

// ------------------------------

function removeDeveloperName(appName, developerName) {
    var normalisedDeveloperName = removeCompanyNameSuffix(developerName);

    // try to remove developer name from start of app name.

    function createStartOfAppNameRegex(input) {
        return new RegExp('^' + escapeForInclusionInRegex(input) + '[®™\u00A9\u24B8\u24D2]?([-\u2013\u2014\u2015\u2016:,\\.]|\\s|\'s)\\s*', 'i');
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
    cleanedAppName = cleanedAppName.replace(removeNonAlphaNumericPrefixRegex, '').trim();
    if (cleanedAppName === '') {
        return appName;
    }

    // return result if developer name was removed from start of app name.
    if (removedFromStartOfAppName) {
        return cleanedAppName;
    }

    // try to remove developer name from end of app name.

    function createEndOfAppNameRegex(input) {
        return new RegExp('[^\\w]?(\\s*(\\ba|\\ban|\\bby|\\bfrom|[-\u2013\u2014\u2015\u2016:,\\.\\(])|\\s)\\s*' + escapeForInclusionInRegex(input) + '.*$', 'i');
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
    cleanedAppName = cleanedAppName.replace(removeNonAlphaNumericSuffixRegex, '').trim();
    if (cleanedAppName === '') {
        return appName;
    }

    // return result if developer name was removed from end of app name.
    return removedFromEndOfAppName ? cleanedAppName : appName;
}

// ------------------------------

var matchBulletRegex = new XRegExp('^(([^\\p{L}\\p{N}"]+?)\\s*)(?:\\b|\\()');

function matchBullet(text) {
    var bulletMatch = text.match(matchBulletRegex);
    if (bulletMatch) {
        return {
            bulletCandidate: bulletMatch[1],
            bulletCandidateCore: bulletMatch[2]
        };
    } else {
        return null;
    }
}

// ------------------------------

var matchNumberBulletRegex = /^((?:[[(]?\s*)((?:[1-9]?[0-9]|[a-zA-Z])\.?)(?:\s*?[\s)\],.-])\s*)/;

function matchNumberBullet(text) {
    var numberBulletMatch = text.match(matchNumberBulletRegex);
    if (numberBulletMatch) {
        return {
            orderedCandidate: numberBulletMatch[1],
            orderedCandidateCore: numberBulletMatch[2].toLowerCase()
        };
    } else {
        return null;
    }
}

// ------------------------------

var getInitialNonAlphaNumericSubstringRegex = new XRegExp('^([^\\p{L}\\p{N}\\s"]+)');

function getInitialNonAlphaNumericSubstring(text) {
    var match = text.match(getInitialNonAlphaNumericSubstringRegex);
    return match ? match[1] : null;
}

// ------------------------------

var isAllSameCharacter = function(text) {
    // true if string consists of same character repeated.

    if (!text) {
        return false;
    }

    for (var i = 1; i < text.length; ++i) {
        if (text[i] !== text[0]) {
            return false;
        }
    }

    return true;
};

// ------------------------------

var replaceWhitespaceRunsRegex = /\s{2,}/g;
var replaceSingleCharNonSpaceWhitespaceRunsRegex = /[^\S ]/g;

function normaliseWhitespace(text) {
    if (!text) {
        return '';
    }

    return text
        .replace(replaceWhitespaceRunsRegex, ' ')
        .replace(replaceSingleCharNonSpaceWhitespaceRunsRegex, ' ')
        .trim();
}

// ------------------------------

function isPossibleHeading(text) {
    if (text.length < 3 || text.length > 200) {
        return false;
    }

    var lastChar = text[text.length - 1];

    if (lastChar === '.') {
        return false;
    }

    if (lastChar === ':' || lastChar === '-' || lastChar === '\u2013' || lastChar === '\u2014' || lastChar === '\u2015' || lastChar === '\u2016') {
        return true;
    }

    var noWhitespaceText = text.replace(/\s+/g, '');
    var capitalLetterCount = 0;

    for (var i = 0; i < noWhitespaceText.length; ++i) {
        var charCode = noWhitespaceText.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
            ++capitalLetterCount;
        }
    }

    var capitalLetterPercentage = (100.00 / noWhitespaceText.length) * capitalLetterCount;
    if (capitalLetterPercentage >= 80) {
        return true;
    }

    return false;
}

// ------------------------------

function isMoreAppsText(text, developerName) {
    if (text.length > 200) {
        return false;
    }

    developerName = removeCompanyNameSuffix(developerName);
    var escapedDeveloperName = escapeForInclusionInRegex(developerName);

    if (text.match(new RegExp('\\b(more|other)\\b.+\\b(games?|apps?)\\b.+\\b(from|by)\\b', 'i'))) {
        return true;
    }

    if (text.match(/\bby\b.+\bsame\b.+\bdeveloper\b/i)) {
        return true;
    }

    if (text.match(/\b(our|try)\b.+\bother\b.+\b(games?|apps?)\b/i)) {
        return true;
    }

    if (text.match(new RegExp('\\b(more|other)\\b.+\\b(from|by)\\b.+\\b' + escapedDeveloperName, 'i'))) {
        return true;
    }

    if (text.match(new RegExp('\\b(more|other)\\b.+\\b' + escapedDeveloperName + '\\b.+\\b(games?|apps?)\\b', 'i'))) {
        return true;
    }

    return false;
}

// ------------------------------

var isNoteTextRegex = /^[\W]*\s*note\b\s*\W/i;

function isNoteText(text) {
    return isNoteTextRegex.test(text);
}

// ------------------------------

var removeExtraTextFromStartRegex = new XRegExp('^\\([^\\)]+\\)\\s*', 'i');

function removeExtraTextFromStart(text) {
    var result = text.replace(removeExtraTextFromStartRegex, '').trim();
    return result === '' ? text : result;
}

// ------------------------------

function getTextTitleForAppNameSimilarityTest(text) {
    var result = removeExtraTextFromStart(text);
    return result;
}

// ------------------------------

exports.getTextTitle = getTextTitle;
exports.hasSomeAlphaNumericContent = hasSomeAlphaNumericContent;
exports.escapeForInclusionInRegex = escapeForInclusionInRegex;
exports.removeEndParentheses = removeEndParentheses;
exports.removeCompanyNameSuffix = removeCompanyNameSuffix;
exports.removeAppTypeSuffix = removeAppTypeSuffix;
exports.removeDeveloperName = removeDeveloperName;
exports.matchBullet = matchBullet;
exports.matchNumberBullet = matchNumberBullet;
exports.getInitialNonAlphaNumericSubstring = getInitialNonAlphaNumericSubstring;
exports.isAllSameCharacter = isAllSameCharacter;
exports.normaliseWhitespace = normaliseWhitespace;
exports.isPossibleHeading = isPossibleHeading;
exports.isMoreAppsText = isMoreAppsText;
exports.isNoteText = isNoteText;
exports.removeExtraTextFromStart = removeExtraTextFromStart;
exports.getTextTitleForAppNameSimilarityTest = getTextTitleForAppNameSimilarityTest;
