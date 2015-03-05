'use strict';

var XRegExp = require('xregexp').XRegExp;
var nlpCompromise = require('nlp_compromise');
var tokenisation = require('./tokenisation');

// ------------------------------

var removeNonAlphaNumericPrefixRegex = /^[^\w]*/;
var removeNonAlphaNumericSuffixRegex = /[^\w]*$/;

function isAsciiUpperCase(charCode) {
    return charCode >= 65 && charCode <= 90;
}

function isAsciiLowerCase(charCode) {
    return charCode >= 97 && charCode <= 122;
}

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

var matchBareBulletRegex = /[:\u2013\u2014\u2015\u2016-]$/i;

function matchBareBullet(text) {
    text = text.trim();

    var parsedSentences = nlpCompromise.sentences(text);
    if (parsedSentences.length > 1) {
        return false;
    }

    if (text === '' || text.length > 200) {
        return false;
    }

    return !matchBareBulletRegex.test(text);
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

var matchNumberBulletRegex = /^((?:[[(]?\s*)([1-9]?[0-9]|[a-zA-Z])\.?(?:\s*?[\s)\],.-])\s*)/;

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

    if (isInUpperCase(text)) {
        return true;
    }

    var lastChar = text[text.length - 1];

    if (lastChar === '.') {
        return false;
    }

    if (lastChar === ':' || lastChar === '-' || lastChar === '\u2013' || lastChar === '\u2014' || lastChar === '\u2015' || lastChar === '\u2016') {
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

var isNoteTextRegex = /^[\W]*\s*((please\s+)?note|important|requirements|minimum requirements)\b\s*\W/i;

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

function isInUpperCase(text) {
    var textLength = text.length;
    var lowerCaseCount = 0;
    var upperCaseCount = 0;

    for (var i = 0; i < textLength; ++i) {
        var charCode = text.charCodeAt(i);

        if (isAsciiUpperCase(charCode)) {
            ++upperCaseCount;
        } else if (isAsciiLowerCase(charCode)) {
            ++lowerCaseCount;
        }
    }

    if (upperCaseCount <= 1) {
        return false;
    }

    var totalCount = lowerCaseCount + upperCaseCount;

    var percentageUpperCase = (100.0 / totalCount) * upperCaseCount;
    return percentageUpperCase >= (totalCount < 10 ? 80 : (totalCount < 20 ? 90 : 95));
}

// ------------------------------

function mayStartWithAppName(text) {
    text = text.replace(/^[^\w"'\u0096\u8216\u8220]]/);
    text = removeExtraTextFromStart(text);
    text = text.replace(/^[^\w"'\u0096\u8216\u8220]]/);

    if (text === '') {
        return false;
    }

    var textTitle = null;

    switch (text[0]) {
        case '\'':
            textTitle = getAppNameSubstring(text, '\'');
            break;
        case '"':
            textTitle = getAppNameSubstring(text, '"');
            break;
        case '\u0096':
            textTitle = getAppNameSubstring(text, '\u0180');
            break;
        case '\u8216':
            textTitle = getAppNameSubstring(text, '\u8217');
            break;
        case '\u8220':
            textTitle = getAppNameSubstring(text, '\u8221');
            break;
    }

    if (textTitle === null) {
        textTitle = getTextTitle(text);
    }

    return isMajorityCapitalized(textTitle ? textTitle : text); // TODO checking text may not be a good idea.
}

function getAppNameSubstring(text, stopChar) {
    var index = text.indexOf(stopChar, 2);
    return index === -1 ? null : text.substring(1, index - 1);
}

function isMajorityCapitalized(text) {
    var tokens = tokenisation.tokenise(text);
    var totalTokens = tokens.length;
    var capitalisedTokensCount = 0;

    for (var i = 0; i < totalTokens; ++i) {
        var token = tokens[i];
        if (token.capitalised) {
            ++capitalisedTokensCount;
        }
    }

    var percentageTokensCapitalized = (100.0 / totalTokens) * capitalisedTokensCount;
    return percentageTokensCapitalized >= 50;
}

// ------------------------------

function getPossibleAppNames(text) {
    var tokens = tokenizeTextIncludingNonAlphanumericTokens(text);
    var tokenGroups = [];
    var tokenGroup = [];

    for (var i = 1; i < tokens.length; ++i) {
        var token = tokens[i];

        if (tokenStartsGroup(token) && tokenGroup.length) {
            if (tokenGroup.length > 1) {
                tokenGroups.push(tokenGroup);
            }

            tokenGroup = [];
        }

        if (tokenStartsWithUppercaseLetterOrNumber(token)) {
            token.nameToken = true;
            tokenGroup.push(token);
        } else if (!tokenIsBreakWord(token) && hasSomeAlphaNumericContent(token.normalised)) {
            // push up to one token that does not start with uppercase letter or number.

            if (tokenGroup.length > 0 && tokenGroup[tokenGroup.length - 1].nameToken) {
                tokenGroup.push(token);
            }
        }

        if ((tokenEndsGroup(token) || i === (tokens.length - 1)) && tokenGroup.length) {
            // TODO think about this.

            if (tokenGroup.length > 1 || tokenGroups.length > 0) {
                tokenGroups.push(tokenGroup);
            }

            tokenGroup = [];
        }
    }

    var appNames = [];

    for (i = 0; i < tokenGroups.length; ++i) {
        tokenGroup = tokenGroups[i];

        var appName = tokenGroup.map(function(x) { return x.normalised; }).join(' ');
        appNames.push(appName);
    }

    return appNames;
}

function tokenStartsGroup(token) {
    var firstChar = token.text.length ? token.text[0] : '';
    return firstChar === ',' || firstChar === ';' || firstChar === ':';
}

function tokenIsBreakWord(token) {
    return token.normalised === 'and' || token.text === '&';
}

function tokenEndsGroup(token) {
    if (tokenIsBreakWord(token)) {
        return true;
    }

    var lastChar = token.text.length ? token.text[token.text.length - 1] : '';
    return lastChar === ',' || lastChar === ';' || lastChar === ':';
}

function tokenStartsWithUppercaseLetterOrNumber(token) {
    return /^[A-Z0-9]/.test(token.text);
}

function tokenizeTextIncludingNonAlphanumericTokens(text) {
    var sentences = nlpCompromise.tokenize(text);
    var tokens = [];

    for (var i = 0; i < sentences.length; ++i) {
        var sentence = sentences[i];

        for (var j = 0; j < sentence.tokens.length; ++j) {
            tokens.push(sentence.tokens[j]);
        }
    }

    return tokens;
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
exports.matchBareBullet = matchBareBullet;
exports.isInUpperCase = isInUpperCase;
exports.mayStartWithAppName = mayStartWithAppName;
exports.getPossibleAppNames = getPossibleAppNames;
