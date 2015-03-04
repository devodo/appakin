'use strict';

var XRegExp = require('xregexp').XRegExp;
var patternMatching = require('./patternMatching');
var modelFactory = require('./model/modelFactory');
var Description = require('./model/description').Description;
var Sentence = require('./model/sentence').Sentence;
var List = require('./model/list').List;

function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

var getNextOrderValue = function(char) {
    if (isFinite(char)) {
        return (parseInt(char) + 1).toString();
    } else {
        return nextChar(char);
    }
};

function removeDividersAndEmphasisMarkers(line) {
    // detect nonalphanum at start of line.

    var startMatch = patternMatching.getInitialNonAlphaNumericSubstring(line.content);
    if (startMatch) {
        if (startMatch === line.content) {
            // match is on entire paragraph, so it's a divider.
            line.content = '';
        } else if (patternMatching.isAllSameCharacter(startMatch)) {
            //log.debug('all same char: ' + line.content);

            var endMatch = line.content.match(new XRegExp('(' + patternMatching.escapeForInclusionInRegex(startMatch[0]) + '+)$'));
            if (endMatch) {
                // nonalphanum string occurs at end as well as start of paragraph; mark it as emphasised.
                line.isEmphasized = true;

                //log.debug('repeated: ' + line.content);

                // remove those characters.
                line.content = line.content.substring(startMatch.length, line.content.length - endMatch[1].length).trim();
            }
        } else {
            if (line.content.indexOf(startMatch, line.content.length - startMatch.length) !== -1) {
                // the pattern of nonalphanum chars at the start of the paragraph
                // is mirrored at the end of the paragraph.

                //log.debug('same: ' + line.content);

                // remove those characters.
                line.content = line.content.substring(startMatch.length, line.content.length - startMatch.length).trim();
            }
        }
    }

    return line;
}

function formLineGroupings(lines) {
    // Use the empty lines and divider lines to group the description lines into paragraphs,
    // removing those lines in the process.

    var lineGroupings = [];
    var currentLineGrouping = [];
    var lastIndex = lines.length - 1;

    for (var i = 0; i < lines.length; ++i) {
        var currentLine = lines[i];

        if (currentLine.content === '') {
            if (currentLineGrouping.length > 0) {
                lineGroupings.push(currentLineGrouping);
                currentLineGrouping = [];
            }
        } else {
            currentLineGrouping.push(currentLine);

            if (i === lastIndex) {
                lineGroupings.push(currentLineGrouping);
            }
        }
    }

    return lineGroupings;
}

function markPossibleListItem(line) {
    var bulletMatch = patternMatching.matchBullet(line.content);
    if (bulletMatch) {
        line.bulletCandidate = bulletMatch.bulletCandidate;
        line.bulletCandidateCore = bulletMatch.bulletCandidateCore;
        return line;
    }

    var numberMatch = patternMatching.matchNumberBullet(line.content);
    if (numberMatch) {
        line.orderedCandidate = numberMatch.orderedCandidate;
        line.orderedCandidateCore = numberMatch.orderedCandidateCore;
        return line;
    }

    var bareBulletMatch = patternMatching.matchBareBullet(line.content);
    if (bareBulletMatch) {
        line.bareBulletCandidate = true;
        return line;
    }

    return line;
}

function identifyBareBulletLists(lineGrouping) {
    // mark up bare bullet lists

    for (var i = 0; i < lineGrouping.length; ++i) {
        var line = lineGrouping[i];

        if (line.bareBulletCandidate && i > 0) {
            var previousLine = lineGrouping[i - 1];

            if (previousLine.bareBulletCandidate) {

                if (!previousLine.isList) {
                    previousLine.isList = true;
                    previousLine.bullet = '';
                    previousLine.listContent = previousLine.content;
                    previousLine.isListStart = true;
                }

                line.isList = true;
                line.bullet = '';
                line.listContent = line.content;
            }
        }
    }

    return lineGrouping;
}

function identifyBulletLists(lineGrouping) {
    // mark up bullet lists

    for (var i = 0; i < lineGrouping.length; ++i) {
        var line = lineGrouping[i];

        if (line.bulletCandidate && i > 0) {
            var previousLine = lineGrouping[i - 1];

            if (previousLine.bulletCandidate && line.bulletCandidateCore === previousLine.bulletCandidateCore) {

                if (!previousLine.isList) {
                    previousLine.isList = true;
                    previousLine.bullet = previousLine.bulletCandidate.trim();
                    previousLine.listContent = previousLine.content.substring(previousLine.bulletCandidate.length);
                    previousLine.isListStart = true;
                }

                line.isList = true;
                line.bullet = line.bulletCandidate.trim();
                line.listContent = line.content.substring(line.bulletCandidate.length);
            }
        }
    }

    return lineGrouping;
}

function identifyOrderedBulletLists(lineGrouping) {
    // mark up ordered lists

    for (var i = 0; i < lineGrouping.length; ++i) {
        var line = lineGrouping[i];

        if (line.orderedCandidate && i > 0) {
            var previousLine = lineGrouping[i - 1];

            if (previousLine.orderedCandidate &&
                getNextOrderValue(previousLine.orderedCandidateCore) === line.orderedCandidateCore) {

                if (!previousLine.isList) {
                    previousLine.isList = true;
                    previousLine.bullet = previousLine.orderedCandidate.trim();
                    previousLine.listContent = previousLine.content.substring(previousLine.orderedCandidate.length);
                    previousLine.isListStart = true;
                }

                line.isList = true;
                line.bullet = line.orderedCandidate.trim();
                line.listContent = line.content.substring(line.orderedCandidate.length);
            }
        }
    }

    return lineGrouping;
}

function attachHeaderlessListsToPreviousLineGrouping(lineGroupings) {
    var fixedLineGroupings = [];
    var endsInList = false;

    for (var i = 0; i < lineGroupings.length; ++i) {
        if (fixedLineGroupings.length > 0 && endsInList &&
            lineGroupings[i].length > 0 && lineGroupings[i][0].isList) {

            for (var j = 0; j < lineGroupings[i].length; ++j) {
                fixedLineGroupings[fixedLineGroupings.length - 1].push(lineGroupings[i][j]);
            }
        } else {
            fixedLineGroupings.push(lineGroupings[i]);
        }

        endsInList = lineGroupings[i].length > 0 && lineGroupings[i][lineGroupings[i].length - 1].isList;
    }

    return fixedLineGroupings;
}

function createNormalisedDescription(appDescription, appName, developerName, sameDeveloperAppNames) {
    sameDeveloperAppNames = sameDeveloperAppNames || [];

    if (!appDescription) {
        return new Description([]);
    }

    var lines = appDescription
        .split('\n')
        .map(function (text) {
            text = patternMatching.normaliseWhitespace(text);
            var line = { content: text };
            line = removeDividersAndEmphasisMarkers(line);
            return line;
        });

    var lineGroupings = formLineGroupings(lines);

    lineGroupings = lineGroupings
        .map(function (lineGrouping) {
            lineGrouping = lineGrouping.map(function(line) { return markPossibleListItem(line); });
            lineGrouping = identifyBulletLists(lineGrouping);
            lineGrouping = identifyOrderedBulletLists(lineGrouping);
            lineGrouping = identifyBareBulletLists(lineGrouping);
            return lineGrouping;
        });

    lineGroupings = attachHeaderlessListsToPreviousLineGrouping(lineGroupings);

    return modelFactory.createDescription(lineGroupings, appName, developerName, sameDeveloperAppNames);
}

exports.createNormalisedDescription = createNormalisedDescription;
