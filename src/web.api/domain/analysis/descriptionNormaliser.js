'use strict';

var XRegExp = require('xregexp').XRegExp;
var similarity = require('./similarity');
var Description = require('./model/description').Description;
var Sentence = require('./model/sentence').Sentence;
var SentenceGroup = require('./model/sentenceGroup').SentenceGroup;
var List = require('./model/list').List;
var ListItem = require('./model/listItem').ListItem;
var Paragraph = require('./model/paragraph').Paragraph;
var managedAppNameList = require('./model/managedAppNameList');

var lineStartsWithNonAlphaNumRegex = new XRegExp('^([^\\p{L}\\p{N}\\s"]+)');
var bulletMatchRegex = new XRegExp('^(([^\\p{L}\\p{N}"]+)\\s*\\b)');
var numberBulletMatchRegex = /^((?:[[(]?\s*)((?:[1-9]?[0-9]|[a-zA-Z])\.?)(?:\s*?[\s)\],.-])\s*)/;
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

function createDescriptionModel(lineGroupings, appName, developerName, sameDeveloperAppNames) {
    // Create the description model.

    var paragraphs = [];
    var list, sentenceGroup, listItem, line, elements, currentList;

    for (var i = 0; i < lineGroupings.length; ++i) {
        elements = [];
        currentList = [];

        for (var j = 0; j < lineGroupings[i].length; ++j) {
            line = lineGroupings[i][j];

            if (line.isList) {
                if (line.isListStart && currentList.length > 0) {
                    list = new List(currentList);
                    elements.push(list);
                    currentList = [];
                }

                listItem = createListItem(line.listContent, line.bullet)
                currentList.push(listItem);
            } else {
                if (currentList.length > 0) {
                    list = new List(currentList);
                    elements.push(list);
                    currentList = [];
                }

                sentenceGroup = createSentenceGroup(line.content);
                elements.push(sentenceGroup);
            }
        }

        if (currentList.length > 0) {
            list = new List(currentList);
            elements.push(list);
        }

        paragraphs.push(new Paragraph(elements));
    }

    var manAppNameList = managedAppNameList.createManagedAppNameList(appName, developerName, sameDeveloperAppNames);
    return new Description(paragraphs, manAppNameList);
}

function createListItem(content, bullet) {
    var sentenceGroup = createSentenceGroup(content);
    return new ListItem(sentenceGroup, bullet);
}

function sentence_parser(text) {
    var abbrev, abbrevs, clean, i, sentences, tmp;
    tmp = text.split(/(\S.+?[.\?!])(?=\s+|$|")/g);
    sentences = [];
    abbrevs = ["jr", "mr", "mrs", "ms", "dr", "prof", "sr", "sen", "corp", "calif", "rep", "gov", "atty", "supt", "det", "rev", "col", "gen", "lt", "cmdr", "adm", "capt", "sgt", "cpl", "maj", "dept", "univ", "assn", "bros", "inc", "ltd", "co", "corp", "arc", "al", "ave", "blvd", "cl", "ct", "cres", "exp", "rd", "st", "dist", "mt", "ft", "fy", "hwy", "la", "pd", "pl", "plz", "tce", "Ala", "Ariz", "Ark", "Cal", "Calif", "Col", "Colo", "Conn", "Del", "Fed", "Fla", "Ga", "Ida", "Id", "Ill", "Ind", "Ia", "Kan", "Kans", "Ken", "Ky", "La", "Me", "Md", "Mass", "Mich", "Minn", "Miss", "Mo", "Mont", "Neb", "Nebr", "Nev", "Mex", "Okla", "Ok", "Ore", "Penna", "Penn", "Pa", "Dak", "Tenn", "Tex", "Ut", "Vt", "Va", "Wash", "Wis", "Wisc", "Wy", "Wyo", "USAFA", "Alta", "Ont", "QuÔøΩ", "Sask", "Yuk", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "sept", "vs", "etc", "esp", "llb", "md", "bl", "phd", "ma", "ba", "miss", "misses", "mister", "sir", "esq", "mstr", "lit", "fl", "ex", "eg", "sep", "sept"];
    abbrev = new RegExp("(^| )(" + abbrevs.join("|") + ")[.] ?$", "i");
    for (i in tmp) {
        if (tmp[i]) {
            tmp[i] = tmp[i].replace(/^\s+|\s+$/g, "");
            if (tmp[i].match(abbrev) || tmp[i].match(/[ |\.][A-Z]\.?$/)) {
                tmp[parseInt(i) + 1] = tmp[i] + " " + tmp[parseInt(i) + 1];
            } else {
                sentences.push(tmp[i]);
                tmp[i] = "";
            }
        }
    }
    // console.log(tmp)
    clean = [];
    for (i in sentences) {
        sentences[i] = sentences[i].replace(/^\s+|\s+$/g, "");
        if (sentences[i]) {
            clean.push(sentences[i]);
        }
    }
    if (clean.length == 0) {
        return [text]
    }
    return clean;
}

function createSentenceGroup(line) {
    var sentences = [];
    var parsedSentences = sentence_parser(line);

    for (var i = 0; i < parsedSentences.length; ++i) {
        sentences.push(new Sentence(parsedSentences[i]));
    }

    return new SentenceGroup(sentences);
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

function normaliseSameDeveloperAppNames(appName, sameDeveloperAppNames, developerName) {
    var result = [];

    for (var i = 0; i < sameDeveloperAppNames.length; ++i) {
        var appNameToTest = sameDeveloperAppNames[i];
        appNameToTest = normaliseAppName(appNameToTest, developerName);

        if (similarity.similar(appName, appNameToTest)) {
            result.push(
                //'REMOVED>> ' +
                appNameToTest);
            continue;
        }

        result.push(appNameToTest)
    }

    return result;
}

var normaliseAppNameRegex = /(.*?)((:\s+|\s+\-|\s+\u2013|\s+\u2014).*)/;

function normaliseAppName(appName, developerName) {
    var filteredAppName = appName.replace(new RegExp(developerName, 'i'), '');

    if (filteredAppName.length > 5) {
        // only use the new app name if it's long enough.
        appName = filteredAppName.trim();

        if (appName.indexOf('by', appName.length - 2) !== -1) {
            appName = appName.substring(0, appName.length - 2).trim();
        }
    }

    var matches = normaliseAppNameRegex.exec(appName);
    return matches ? matches[1] : appName;
}

function createNormalisedDescription(appDescription, appName, developerName, sameDeveloperAppNames) {
    sameDeveloperAppNames = sameDeveloperAppNames || [];

    if (!appDescription) {
        return new Description([]);
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

    //var normalisedAppName = normaliseAppName(appName, developerName);
    //sameDeveloperAppNames = normaliseSameDeveloperAppNames(normalisedAppName, sameDeveloperAppNames, developerName);

    return createDescriptionModel(lineGroupings, appName, developerName, sameDeveloperAppNames);
}

exports.createNormalisedDescription = createNormalisedDescription;
