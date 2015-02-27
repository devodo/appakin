'use strict';

var nlpCompromise = require('nlp_compromise');
var List = require('./model/list').List;

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
            paragraph.markAsRemoved('copyright');
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
                paragraph.markAsRemoved('terms & conditions');
                return true;
            }
        });
    });
}

// --------------------------------

var urlRegex = /www\.|http:/;

function removeSentencesWithUrls(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
            sentence.conditionallyMarkAsRemoved(urlRegex, 'url');
        });
    });
}

// --------------------------------

var emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/;

function removeSentencesWithEmailAddresses(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachSentence(true, function(sentence) {
            sentence.conditionallyMarkAsRemoved(emailRegex, 'email');
        });
    });
}

// --------------------------------

function removeListSentences(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(true, function(sentence) {
            var tokenCount = sentence.tokens.length;

            // Don't process short sentences.
            if (tokenCount < 10) {
                return;
            }

            var capitalisedTokenCount = sentence.tokens.filter(function(x) { return x.capitalised; }).length;
            var commaCount = (sentence.content.match(/,/g) || []).length;

            var capitalisedTokenRatio = (capitalisedTokenCount * 1.0) / tokenCount;
            var commaRatio = (commaCount * 1.0) / tokenCount;

            // Remove sentences with many capitalized words.
            if (capitalisedTokenRatio >= 0.66 && tokenCount >= 30) {
                sentence.markAsRemoved('many capitalised tokens');
            }

            // Remove long sentences with many commas.
            if (tokenCount >= 30 && commaRatio >=0.25) {
                sentence.markAsRemoved('long with many commas');
                return;
            }

            // Remove sentences with many commas and capitalised words.
            if (capitalisedTokenRatio >= 0.25 && commaRatio >= 0.4) {
                sentence.markAsRemoved('many commas & capitalised tokens');
            }
        });
    });
}

// --------------------------------

function removeLongSentences(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveSentence(true, function(sentence) {
            if (sentence.tokens.length > 80) {
                sentence.markAsRemoved('long');
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
                sentence.markAsRemoved('trademark symbols');
            }
        });
    });
}

// --------------------------------

exports.removeCopyrightParagraphs = removeCopyrightParagraphs;
exports.removeSentencesWithUrls = removeSentencesWithUrls;
exports.removeSentencesWithEmailAddresses = removeSentencesWithEmailAddresses;
exports.removeTermsAndConditionsParagraphs = removeTermsAndConditionsParagraphs;
exports.removeListSentences = removeListSentences;
exports.removeLongSentences = removeLongSentences;
exports.removeSentencesWithManyTrademarkSymbols = removeSentencesWithManyTrademarkSymbols;


//"** DON'T MISS OUR OTHER EXCITING GAMES! **

// all rights reserved

// MORE LITTLE GOLDEN BOOK APPS:\n- Barbie Princess and the Popstar\n- The Poky Little Puppy\n- The Little Red Hen\n\nMORE APPS FROM RANDOM HOUSE CHILDREN’S BOOKS:\n- Pat the Bunny\n- Princess Baby\n- Wild About Books\n- How Rocket Learned to Read\n\n",