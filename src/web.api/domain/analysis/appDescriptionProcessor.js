'use strict';

var XRegExp = require('xregexp').XRegExp;
var dm = require('./descriptionModel');

var lineStartsWithNonAlphaNumRegex = new XRegExp('^([^\\p{L}\\p{N}\\s"]+)');
var bulletMatchRegex = new XRegExp('^(([^\\p{L}\\p{N}"]+)\\s*\\b)');
var numberBulletMatchRegex = /^((?:[[(]?\s*)((?:[1-9]?[0-9]|[a-zA-Z])\.?)(?:\s*?[\s)\].-])\s*)/;
var escapeRegExpRegex = /([.*+?^=!:${}()|\[\]\/\\])/g;

var escapeRegExp = function(string) {
    return string.replace(escapeRegExpRegex, '\\$1');
};

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

var isUniform = function(string) {
    // true if string consists of same character repeated.

    if (!string) {
        return false;
    }

    for (var i = 1; i < string.length; ++i) {
        if (string[i] !== string[0]) {
            return false;
        }
    }

    return true;
};

function normaliseWhitespace(text) {
    if (!text) {
        return '';
    }

    return text
        .replace(/\s{2,}/g, ' ') // replace runs of whitespace with single space
        .replace(/[^\S ]/g, ' ') // replace single char non-space whitespace runs with single space
        .trim();
}

function removeDividersAndEmphasisMarkers(text) {
    // detect nonalphanum at start of line.

    var startMatch = text.match(lineStartsWithNonAlphaNumRegex);
    if (startMatch) {
        if (startMatch[1] === text) {
            // match is on entire paragraph, so it's a divider.
            text = '';
        } else if (isUniform(startMatch[1])) {
            //log.debug('all same char: ' + text);

            var endMatch = text.match(new XRegExp('(' + escapeRegExp(startMatch[1][0]) + '+)$'));
            if (endMatch) {
                // nonalphanum string occurs at end as well as start of paragraph; mark it as emphasised.

                //log.debug('repeated: ' + text);

                // remove those characters.
                text = text.substring(startMatch[1].length, text.length - endMatch[1].length).trim();
            }
        } else {
            if (text.indexOf(startMatch[1], text.length - startMatch[1].length) !== -1) {
                // the pattern of nonalphanum chars at the start of the paragraph
                // is mirrored at the end of the paragraph.

                //log.debug('same: ' + text);

                // remove those characters.
                text = text.substring(startMatch[1].length, text.length - startMatch[1].length).trim();
            }
        }
    }

    return text;
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
                currentLineGrouping = []
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
    var bulletMatch = line.content.match(bulletMatchRegex);
    if (bulletMatch) {
        line.bulletCandidate = bulletMatch[1];
        line.bulletCandidateCore = bulletMatch[2];
    }

    var numberMatch = line.content.match(numberBulletMatchRegex);
    if (numberMatch) {
        line.orderedCandidate = numberMatch[1];
        line.orderedCandidateCore = numberMatch[2].toLowerCase();
    }

    return line;
}

function identifyBulletLists(lineGrouping) {
    // mark up bullet lists

    for (var i = 0; i < lineGrouping.length; ++i) {
        var line = lineGrouping[i];

        if (line.bulletCandidate && i > 0) {
            var previousLine = lineGrouping[i - 1];

            if (previousLine.bulletCandidate &&
                line.bulletCandidateCore === previousLine.bulletCandidateCore) {

                if (!previousLine.isList) {
                    previousLine.isList = true;
                    previousLine.bullet = previousLine.bulletCandidate.trim();
                    previousLine.listContent = previousLine.content.substring(previousLine.bulletCandidate.length);
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

            //if (previousLine.orderedCandidate) {
            //    log.debug('previous: ' + previousLine.orderedCandidateCore
            //        + ' previous++: ' + getNextOrderValue(previousLine.orderedCandidateCore)
            //    + ' this: ' + line.orderedCandidateCore);
            //}

            if (previousLine.orderedCandidate &&
                getNextOrderValue(previousLine.orderedCandidateCore) === line.orderedCandidateCore) {

                if (!previousLine.isList) {
                    previousLine.isList = true;
                    previousLine.bullet = previousLine.orderedCandidate.trim();
                    previousLine.listContent = previousLine.content.substring(previousLine.orderedCandidate.length);
                }

                line.isList = true;
                line.bullet = line.orderedCandidate.trim();
                line.listContent = line.content.substring(line.orderedCandidate.length);
            }
        }
    }

    return lineGrouping;
}

function createDescriptionModel(lineGroupings) {
    // Create the description model.

    var paragraphs = [];

    for (var i = 0; i < lineGroupings.length; ++i) {
        var lines = [];
        var containsList = false;

        for (var j = 0; j < lineGroupings[i].length; ++j) {
            var line = lineGroupings[i][j];

            lines.push(dm.CreateLine(
                line.isList ? line.listContent : line.content,
                line.isList,
                line.isList ? line.bullet : null
            ));

            containsList = containsList || line.isList;
        }

        paragraphs.push(dm.CreateParagraph(lines, containsList));
    }

    return dm.CreateDescription(paragraphs);
}

function splitSentences(lineGroupings) {
    // Split non-list item lines into separate lines.

    for (var i = 0; i < lineGroupings.length; ++i) {
        var lines = [];

        for (var j = 0; j < lineGroupings[i].length; ++j) {

            // TODO

            lines.push(lineGroupings[i][j]);
        }

        lineGroupings[i] = lines;
    }

    return lineGroupings;
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

function createNormalisedDescription(appDescription) {
    if (!appDescription) {
        return dm.CreateDescription([]);
    }

    var lines = appDescription
        .split('\n') // split into paragraphs
        .map(function (val) {
            val = normaliseWhitespace(val);
            val = removeDividersAndEmphasisMarkers(val);
            return { content: val };
        });

    var lineGroupings = formLineGroupings(lines);

    lineGroupings = lineGroupings
        .map(function (lineGrouping) {
            lineGrouping = lineGrouping.map(function(line) { return markPossibleListItem(line); });
            lineGrouping = identifyBulletLists(lineGrouping);
            lineGrouping = identifyOrderedBulletLists(lineGrouping);
            return lineGrouping;
        });

    lineGroupings = attachHeaderlessListsToPreviousLineGrouping(lineGroupings);
    lineGroupings = splitSentences(lineGroupings);
    return createDescriptionModel(lineGroupings);
}

exports.createNormalisedDescription = createNormalisedDescription;
