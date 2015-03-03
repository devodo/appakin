'use strict';

var nlpCompromise = require('nlp_compromise');
var patternMatching = require('../patternMatching');
var Description = require('./description').Description;
var Sentence = require('./sentence').Sentence;
var SentenceGroup = require('./sentenceGroup').SentenceGroup;
var List = require('./list').List;
var ListItem = require('./listItem').ListItem;
var Paragraph = require('./paragraph').Paragraph;
var managedAppNameList = require('./managedAppNameList');

function createDescription(lineGroupings, appName, developerName, sameDeveloperAppNames) {
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

                listItem = createListItem(line.listContent, line.bullet);
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

function createSentenceGroup(line) {
    var sentences = [];
    var parsedSentences = nlpCompromise.sentences(line);

    for (var i = 0; i < parsedSentences.length; ++i) {
        sentences.push(new Sentence(parsedSentences[i]));
    }

    return new SentenceGroup(sentences);
}

exports.createDescription = createDescription;
