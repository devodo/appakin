'use strict';

function removeCopyrightParagraphs(description) {
    // Remove any paragraph that starts with copyright symbol and only has up to certain number of lines.
    // First line cannot be a list item.

    var maxLinesInParagraph = 2;

    description.forEachActiveParagraph(function(paragraph) {
        var firstLine = paragraph.getLine(0);
        if (!firstLine || firstLine.isListItem) {
            return;
        }

        var startsWithCopyright =
            firstLine.startsWith('\u00A9') ||
            firstLine.startsWith('\u24B8') ||
            firstLine.startsWith('\u24D2');

        if (startsWithCopyright && paragraph.getLinesCount() <= maxLinesInParagraph) {
            paragraph.markAsRemoved();
        }
    });
}

var termsAndConditionsRegex = /terms (and|&) conditions/i;

function removeTermsAndConditionsParagraphs(description) {
    var maxLinesInParagraph = 2;

    description.forEachActiveParagraph(function(paragraph) {
        if (paragraph.getLinesCount() > maxLinesInParagraph) {
            return;
        }

        paragraph.forEachLine(false, function(line) {
            if (termsAndConditionsRegex.test(line)) {
                paragraph.markAsRemoved();
                return true;
            }
        });
    });
}

var urlRegex = /www\.|http:/;

function removeLinesWithUrls(description) {
    description.forEachActiveParagraph(function(paragraph) {
        paragraph.forEachActiveLine(true, function(line) {
            if (urlRegex.test(line)) {
                line.markAsRemoved();
            }
        });
    });
}


// all rights reserved

