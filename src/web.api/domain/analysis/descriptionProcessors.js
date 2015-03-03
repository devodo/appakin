'use strict';

var List = require('./model/list').List;
var Sentence = require('./model/sentence').Sentence;
var patternMatching = require('./patternMatching');
var log = require('../../logger');

// --------------------------------

var WEAK = 0;
var NORMAL = 1;
var STRONG = 2;

// --------------------------------

function setStatistics(description) {
    var descriptionTokenCount = 0;

    description.forEachParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
             descriptionTokenCount += sentence.getTokenCount();
        });
    });

    var runningTokenCount = 0;

    description.forEachParagraph(function(paragraph) {
        runningTokenCount += paragraph.setStatistics(descriptionTokenCount, runningTokenCount);
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

// mmmmmm

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

            if (listItemCount > 30) {
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
               // ignore lists with multi-sentence list items.

               if (listItem.getSentenceCount() > 1) {
                   appNameMatchCount = 0;
                   return true;
               }

               var firstSentence = listItem.getSentence(0);

               // ignore list items that are too long.
               if (!firstSentence  || firstSentence.getTokenCount() > 35) {
                   return;
               }

               if (description.managedAppNameList.matches(firstSentence)) {
                   ++appNameMatchCount;
               }
           });

            log.warn('listItemCount: ' + listItemCount + ' appNameMatchCount: ' + appNameMatchCount);

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
        var firstSentence = paragraph.getFirstSentence();
        var sentenceTitle = patternMatching.getTextTitle(firstSentence.content);

        if (sentenceTitle) {
            var sentence = new Sentence(sentenceTitle);

            if (description.managedAppNameList.matches(sentence, true)) {
                paragraph.markAsRemoved('by same developer (paragraph)', STRONG)
            }
        }
    });
}

// --------------------------------

function removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved(description) {
    description.forEachActiveParagraph(function(paragraph) {
        if (paragraph.locationPercentageRelativeToDescription < 66) {
            return;
        }

        var activePercentage = 0;

        paragraph.forEachActiveSentence(true, function(sentence) {
            activePercentage += sentence.tokenPercentageRelativeToParagraph;
        });

        if (activePercentage < 45) {
            paragraph.markAsRemoved('already mostly removed', WEAK);
        }
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
exports.removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved = removeParagraphsInLatterPartOfDescriptionThatAreAlreadyMostlyRemoved;

// Editor's Choice

// looks like header

//"** DON'T MISS OUR OTHER EXCITING GAMES! **
// by same developer

//Please also check out our other great Apps for kids:
//Try other awesome games by Cat Studio

//More Great iPad apps from Playrix:

// MORE LITTLE GOLDEN BOOK APPS:\n- Barbie Princess and the Popstar\n- The Poky Little Puppy\n- The Little Red Hen\n\nMORE APPS FROM RANDOM HOUSE CHILDREN’S BOOKS:\n- Pat the Bunny\n- Princess Baby\n- Wild About Books\n- How Rocket Learned to Read\n\n",