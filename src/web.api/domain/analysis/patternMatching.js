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

exports.getTextTitle = getTextTitle;
exports.hasSomeAlphaNumericContent = hasSomeAlphaNumericContent;
exports.escapeForInclusionInRegex = escapeForInclusionInRegex;
exports.removeEndParentheses = removeEndParentheses;
exports.removeCompanyNameSuffix = removeCompanyNameSuffix;
exports.removeAppTypeSuffix = removeAppTypeSuffix;
exports.removeDeveloperName = removeDeveloperName;
