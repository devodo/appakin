'use strict';

var List = require('./model/list').List;
var Sentence = require('./model/sentence').Sentence;
var SentenceGroup = require('./model/sentenceGroup').SentenceGroup;
var patternMatching = require('./patternMatching');
var log = require('../../logger');

// --------------------------------

var WEAK = 0;
var NORMAL = 1;
var STRONG = 2;

// --------------------------------

function setStatistics(description) {
    var descriptionLength = 0;

    description.forEachParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
             descriptionLength += sentence.getLength();
        });
    });

    var runningLength = 0;

    description.forEachParagraph(function(paragraph) {
        runningLength += paragraph.setStatistics(descriptionLength, runningLength);
    });
}

// --------------------------------

function removeCopyrightParagraphs(description) {
    // Remove any paragraph that starts with copyright symbol/word and only has up to certain number of lines.
    // First line cannot be a list item.

    var maxSentencesInParagraph = 5;

    description.forEachActiveParagraph(function(paragraph) {
        var firstElement = paragraph.getElement(0);
        if (!firstElement || firstElement instanceof List) {
            return;
        }

        var firstSentence = firstElement.getSentence(0);
        if (!firstSentence) {
            return;
        }

        var startsWithCopyright =
            firstSentence.content.indexOf('Copyright ') === 0 ||
            firstSentence.content.indexOf('copyright ') === 0 ||
            firstSentence.content.indexOf('\u00A9') === 0 ||
            firstSentence.content.indexOf('\u24B8') === 0 ||
            firstSentence.content.indexOf('\u24D2') === 0;

        if (startsWithCopyright && paragraph.getSentenceCount() <= maxSentencesInParagraph) {
            paragraph.markAsRemoved('copyright', STRONG);
        }
    });
}

// --------------------------------

var termsAndConditionsRegex = /terms (and|&) conditions|privacy policy|all rights reserved/i;

function removeTermsAndConditionsParagraphs(description) {
    var maxSentencesInParagraph = 5;

    description.forEachActiveParagraph(function(paragraph) {
        if (paragraph.getSentenceCount() > maxSentencesInParagraph) {
            return;
        }

        paragraph.forEachSentence(false, function(sentence) {
            if (termsAndConditionsRegex.test(sentence.content)) {
                paragraph.markAsRemoved('terms & conditions', STRONG);
                return true;
            }
        });
    });
}

// --------------------------------

var urlRegex = /\bwww\.|\bhttps?:\/|twitter\.com\/|youtube\.com\/|facebook\.com\/|\w\.com\//i;

function removeSentencesWithUrls(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
            sentence.conditionallyMarkAsRemoved(urlRegex, 'url', NORMAL);
        });
    });
}

// --------------------------------

var twitterRegex = /\s@\w+\b/;

function removeSentencesWithTwitterNames(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
            sentence.conditionallyMarkAsRemoved(twitterRegex, 'twitter', NORMAL);
        });
    });
}

// --------------------------------

var emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/;

function removeSentencesWithEmailAddresses(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
            sentence.conditionallyMarkAsRemoved(emailRegex, 'email', NORMAL);
        });
    });
}

// --------------------------------

function removeListSentences(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(true, function(sentence) {
            var tokenCount = sentence.getTokenCount();

            // Don't process short sentences.
            if (tokenCount < 10) {
                return;
            }

            var capitalisedTokenCount = sentence.getTokens().filter(function(x) { return x.capitalised; }).length;
            var commaCount = (sentence.content.match(/,/g) || []).length;

            var capitalisedTokenRatio = (capitalisedTokenCount * 1.0) / tokenCount;
            var commaRatio = (commaCount * 1.0) / tokenCount;

            // Remove sentences with many capitalized words.
            if (capitalisedTokenRatio >= 0.66 && tokenCount >= 30) {
                sentence.markAsRemoved('many capitalised tokens', STRONG);
            }

            // Remove long sentences with many commas.
            if (tokenCount >= 30 && commaRatio >=0.25) {
                sentence.markAsRemoved('long with many commas', STRONG);
                return;
            }

            // Remove sentences with many commas and capitalised words.
            if (capitalisedTokenRatio >= 0.25 && commaRatio >= 0.4) {
                sentence.markAsRemoved('many commas & capitalised tokens', STRONG);
            }
        });
    });
}

// --------------------------------

function removeLongSentences(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(true, function(sentence) {
            if (sentence.getTokenCount() > 80) {
                sentence.markAsRemoved('long', NORMAL);
            }
        });
    });
}

// --------------------------------

function removeSentencesWithManyTrademarkSymbols(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(true, function(sentence) {
            var trademarkCount = (sentence.content.match(/™|®/g) || []).length;

            if (trademarkCount > 4) {
                sentence.markAsRemoved('trademark symbols', NORMAL);
            }
        });
    });
}

// --------------------------------

function removeLongLists(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveList(function(list) {
            var listItemCount = list.getListItemCount();

            if (listItemCount > 20 || (listItemCount > 12 && paragraph.isInLatterPartOfDescription())) {
                list.markAsRemoved('list too long', NORMAL);
            }
        });
    });
}

// --------------------------------

function removeListsOfAppsBySameDeveloperByMatchingAppNames(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveList(function(list) {
           var listItemCount = list.getListItemCount();

           // ignore short lists
           if (listItemCount <= 1) {
               return;
           }

           var appNameMatchCount = 0;

           list.forEachListItem(function(listItem) {
               // ignore lists with long multi-sentence list items.

               if (listItem.getSentenceCount() > 3) {
                   appNameMatchCount = 0;
                   return true;
               }

               var titleSentence = listItem.getTitleSentence();

               if (titleSentence && description.managedAppNameList.matches(titleSentence)) {
                   ++appNameMatchCount;
               }
           });

            //log.warn('listItemCount: ' + listItemCount + ' appNameMatchCount: ' + appNameMatchCount);

           var matchPercentage = (100.0 / listItemCount) * appNameMatchCount;
           if (matchPercentage >= 50) {
               list.markAsRemoved('by same developer (list)', STRONG);
           }
        });
    });
}

// --------------------------------

function removeParagraphsThatStartWithNameOfAppBySameDeveloper(description) {
    description.forEachActiveParagraph(function(paragraph) {
        var firstElement = paragraph.getElement(0);

        if (firstElement && firstElement instanceof SentenceGroup && firstElement.getSentenceCount() <= 2) {
            var titleSentence = firstElement.getTitleSentence();

            //var firstSentence = firstElement.getFirstSentence();
            //var sentenceTitle = firstElement.getSentenceGroupTitle();

            //var firstSentence = firstElement.getFirstSentence();
            //var sentenceTitle = patternMatching.getTextTitleForAppNameSimilarityTest(firstSentence.content);
                     // patternMatching.getTextTitle(firstSentence.content);

            if (titleSentence && description.managedAppNameList.matches(titleSentence, true)) {
                paragraph.markAsRemoved('by same developer (paragraph)', STRONG);
            }
        }
    });
}

// --------------------------------

function removeListsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved(description) {
    description.forEachActiveParagraph(function(paragraph) {
        if (!paragraph.isInLatterPartOfDescription()) {
            return;
        }

        paragraph.forEachActiveList(function(list) {
            var listPercentage = 0;
            var activePercentage = 0;

            list.forEachSentence(function(sentence) {
                var percentage = sentence.getTokenCount();

                if (!sentence.isRemoved) {
                    activePercentage += percentage;
                }

                listPercentage += percentage;
            });

            listPercentage = (100.0 / listPercentage) * activePercentage;

            if (listPercentage < 45) {
                list.markAsRemoved('list is near end and already mostly removed', WEAK);
            }
        });
    });
}

function removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved(description) {
    description.forEachActiveParagraph(function(paragraph) {
        if (!paragraph.isInLatterPartOfDescription()) {
            return;
        }

        var activePercentage = 0;

        paragraph.forEachActiveSentence(true, function(sentence) {
            activePercentage += sentence.lengthPercentageRelativeToParagraph;
        });

        if (activePercentage < 45) {
            paragraph.markAsRemoved('paragraph is near end and already mostly removed', WEAK);
        }
    });
}

function removeParagraphsInLatterPartOfDescriptionThatHaveRemovedContentAroundThem(description) {
    var removeParagraphs = false;

    description.forEachParagraph(function(paragraph) {
        if (!paragraph.isInLatterPartOfDescription()) {
            return;
        }

        if (!removeParagraphs && paragraph.isRemoved) {
            removeParagraphs = true;
        }

        if (removeParagraphs && !paragraph.isRemoved) {
            paragraph.markAsRemoved('paragraph is near end and has removed content around it', WEAK);
        }
    });
}

// --------------------------------

function removeHeaderSentencesBeforeAlreadyRemovedContent(description) {
    var previousHeaderParagraph = null;

    description.forEachParagraph(function(paragraph) {
        if (paragraph.isRemoved && previousHeaderParagraph) {
            previousHeaderParagraph.markAsRemoved('header for already removed paragraph', NORMAL);
        }

        if (paragraph.getIsPossibleHeading()) {
            previousHeaderParagraph = paragraph;
        } else {
            previousHeaderParagraph = null;
        }
    });
}

function removeHeaderSentencesBeforeAlreadyRemovedLists(description) {
    var previousHeaderSentence = null;

    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachElement(function(element) {
            if (element instanceof List && element.isRemoved && previousHeaderSentence) {
                previousHeaderSentence.markAsRemoved('header for already removed list', NORMAL);
            }

            if (element instanceof SentenceGroup && element.getIsPossibleHeading()) {
                previousHeaderSentence = element.getFirstSentence();
            } else {
                previousHeaderSentence = null;
            }
        })
    });
}

// --------------------------------

function removeHeadersAndListsForRelatedApps(description) {
    description.forEachActiveParagraph(function(paragraph) {
        if (paragraph.getElementCount() < 2) {
            return;
        }

        if (!(paragraph.getElement(0) instanceof SentenceGroup && paragraph.getElement(1) instanceof List)) {
            return;
        }

        var sentenceGroup = paragraph.getElement(0);
        var list = paragraph.getElement(1);

        var firstSentence = sentenceGroup.getFirstSentence();
        if (!patternMatching.isMoreAppsText(firstSentence.content, description.managedAppNameList.developerName)) {
            return;
        }

        list.markAsRemoved('preceded by more apps sentence', STRONG);
    });
}

// --------------------------------

function removeNoteParagraphs(description) {
    description.forEachActiveParagraph(function(paragraph) {
        var firstSentence = paragraph.getFirstSentence();

        if (patternMatching.isNoteText(firstSentence.content)) {
            paragraph.markAsRemoved('note paragraph', NORMAL);
        }
    });
}

// --------------------------------

var removeTechnicalDetailsRegex = /minimum\s+requirements?/i;

function removeTechnicalDetailSentences(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(false, function(sentence) {
            if (removeTechnicalDetailsRegex.test(sentence.content)) {
                if (sentence.isPossibleHeading) {
                    paragraph.markAsRemoved('technical details (heading)', NORMAL);
                } else {
                    sentence.markAsRemoved('technical details', NORMAL);
                }
            }
        });
    });
}

// --------------------------------

// TODO could look for paragraph like 'Try other awesome games by Cat Studio' to signal that the below is possible.
// TODO could restrict this to latter part of description.
function removeParagraphsOfRelatedAppsThatAreIndividualSentenceGroups(description) {
    description.forEachActiveParagraph(function(paragraph) {
        var elementCount = 0;
        var mayStartWithAppNameCount = 0;

        paragraph.forEachActiveSentenceGroup(function(sentenceGroup) {
            ++elementCount;
            var firstSentence = sentenceGroup.getFirstSentence();

            if (patternMatching.mayStartWithAppName(firstSentence.content)) {
                ++mayStartWithAppNameCount;
            }
        });

        if (elementCount <= 3) {
            return;
        }

        var percentageMayStartWithAppName = (100.0 / elementCount) * mayStartWithAppNameCount;
        if (percentageMayStartWithAppName < 50) {
            return;
        }

        var appNameMatchCount = 0;

        paragraph.forEachActiveSentenceGroup(function(sentenceGroup) {
            var firstSentence = sentenceGroup.getFirstSentence();

            if (firstSentence && description.managedAppNameList.matches(firstSentence)) {
                ++appNameMatchCount;
            }
        });

        var percentageStartWithAppName = (100.0 / elementCount) * appNameMatchCount;
        if (percentageStartWithAppName >= 50) {
            paragraph.markAsRemoved('related app names (sentence group starts)', STRONG);
        }
    });
}

// --------------------------------

/*
identify sentences with multiple commas (


find runs of capitalized or number-start tokens, using 'and/or' and commas to separate the runs.
if find three or more, try matching to app names.

 */
function removeSentencesOfRelatedApps(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(false, function(sentence) {
            var possibleAppNames = patternMatching.getPossibleAppNames(sentence.content);
            if (possibleAppNames.length < 3) {
                return;
            }

            var appNameMatchCount = 0;

            for (var i = 0; i < possibleAppNames.length; ++i) {
                var possibleAppName = possibleAppNames[i];
                var possibleAppNameSentence = new Sentence(possibleAppName);

                if (description.managedAppNameList.matches(possibleAppNameSentence)) {
                    ++appNameMatchCount;
                }
            }

            var percentageMatch = (100.0 / possibleAppNames.length) * appNameMatchCount;
            if (percentageMatch >= 50) {
                sentence.markAsRemoved('related app names in sentence', STRONG);
            }
        });
    });
}

// --------------------------------

exports.setStatistics = setStatistics;
exports.removeCopyrightParagraphs = removeCopyrightParagraphs;
exports.removeSentencesWithUrls = removeSentencesWithUrls;
exports.removeSentencesWithTwitterNames = removeSentencesWithTwitterNames;
exports.removeSentencesWithEmailAddresses = removeSentencesWithEmailAddresses;
exports.removeTermsAndConditionsParagraphs = removeTermsAndConditionsParagraphs;
exports.removeListSentences = removeListSentences;
exports.removeLongSentences = removeLongSentences;
exports.removeSentencesWithManyTrademarkSymbols = removeSentencesWithManyTrademarkSymbols;
exports.removeListsOfAppsBySameDeveloperByMatchingAppNames = removeListsOfAppsBySameDeveloperByMatchingAppNames;
exports.removeLongLists = removeLongLists;
exports.removeParagraphsThatStartWithNameOfAppBySameDeveloper = removeParagraphsThatStartWithNameOfAppBySameDeveloper;
exports.removeListsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved = removeListsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved;
exports.removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved = removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved;
exports.removeHeaderSentencesBeforeAlreadyRemovedContent = removeHeaderSentencesBeforeAlreadyRemovedContent;
exports.removeHeaderSentencesBeforeAlreadyRemovedLists = removeHeaderSentencesBeforeAlreadyRemovedLists;
exports.removeParagraphsInLatterPartOfDescriptionThatHaveRemovedContentAroundThem = removeParagraphsInLatterPartOfDescriptionThatHaveRemovedContentAroundThem;
exports.removeHeadersAndListsForRelatedApps = removeHeadersAndListsForRelatedApps;
exports.removeNoteParagraphs = removeNoteParagraphs;
exports.removeTechnicalDetailSentences = removeTechnicalDetailSentences;
exports.removeParagraphsOfRelatedAppsThatAreIndividualSentenceGroups = removeParagraphsOfRelatedAppsThatAreIndividualSentenceGroups;
exports.removeSentencesOfRelatedApps = removeSentencesOfRelatedApps;
