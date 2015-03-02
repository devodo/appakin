'use strict';

var managedAppName = require('../../../domain/analysis/model/managedAppName');
var Sentence = require('../../../domain/analysis/model/sentence').Sentence;
var normaliseDeveloperName = managedAppName.normaliseDeveloperName;
var removeDeveloperName = managedAppName.removeDeveloperName;
var removeAppTypeSuffix = managedAppName.removeAppTypeSuffix;
var removeParenthesesAtEnd = managedAppName.removeParenthesesAtEnd;
var createManagedAppName = managedAppName.createManagedAppName;

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testNormaliseDeveloperName: function (test) {
        doTestNormaliseDeveloperName('Spotify', 'Spotify', test);
        doTestNormaliseDeveloperName('Less Spotify', 'Less Spotify', test);
        doTestNormaliseDeveloperName('Spotify, LLC', 'Spotify', test);
        doTestNormaliseDeveloperName('Spotify LLC', 'Spotify', test);
        doTestNormaliseDeveloperName('Spot ify, Ltd', 'Spot ify', test);
        doTestNormaliseDeveloperName('Spotify    Ltd', 'Spotify', test);
        test.done();
    },

    testRemoveDeveloperName: function (test) {
        doTestRemoveDeveloperName('3tv (by 3HK)', '3HK', '3tv', test);
        doTestRemoveDeveloperName('#Wiskunde Plantyn', 'Plantyn', '#Wiskunde', test);
        doTestRemoveDeveloperName('(ISC)² Practice Tests App', '(ISC)²', 'Practice Tests App', test);
        doTestRemoveDeveloperName('1 Word Country Guessing Quiz PREMIUM by The Other Games', 'The Other Games', '1 Word Country Guessing Quiz PREMIUM', test);
        doTestRemoveDeveloperName('AIRCADEMY', 'airCademy', 'AIRCADEMY', test);
        doTestRemoveDeveloperName('ALICE’S ADVENTURES IN WONDERLAND HD. ITBOOK STORY', 'itbook', 'ALICE’S ADVENTURES IN WONDERLAND HD', test);
        doTestRemoveDeveloperName('Animals of Africa (EWNOR)', 'EWNOR', 'Animals of Africa', test);
        doTestRemoveDeveloperName('Antigone by Jean Anouilh from L.A. Theatre Works', 'L.A. Theatre Works', 'Antigone by Jean Anouilh', test);
        doTestRemoveDeveloperName('Around the caps bookshop Full', 'Around the caps', 'bookshop Full', test);
        doTestRemoveDeveloperName('2Accorpa\'s 4Antelope', '2Accorpa', '4Antelope', test);
        doTestRemoveDeveloperName('CADAL_WXZ', 'CADAL', 'CADAL_WXZ', test);
        doTestRemoveDeveloperName('Adami-Avignon 2014', 'ADAMI', 'Avignon 2014', test);
        doTestRemoveDeveloperName('Adobe® Eazel for Photoshop®', 'Adobe', 'Eazel for Photoshop®', test);
        doTestRemoveDeveloperName('Camino del Salvador - A Wise Pilgrim Guide', 'Wise Pilgrim', 'Camino del Salvador', test);
        doTestRemoveDeveloperName('Chester Comix: The Battle of Britain', 'Chester Comix', 'The Battle of Britain', test);
        doTestRemoveDeveloperName('Amazon Monkey Swing Free by Brianson Technologies - A Sonic Dash Physics Rope Game', 'Brianson Technologies', 'Amazon Monkey Swing Free', test);
        doTestRemoveDeveloperName('English lessons for beginners - Le Monde.fr', 'Le Monde.fr', 'English lessons for beginners', test);
        doTestRemoveDeveloperName('FLTRP-Three Little Pigs', 'FLTRP', 'Three Little Pigs', test);
        doTestRemoveDeveloperName('Fastr Pro - speed reading and text comprehension training', 'Fastr', 'Pro - speed reading and text comprehension training', test);
        doTestRemoveDeveloperName('FelisisSolutions', 'Felisis', 'FelisisSolutions', test);
        doTestRemoveDeveloperName('FLTRP-Jack and the Beanstalk', 'FLTRP', 'Jack and the Beanstalk', test);
        doTestRemoveDeveloperName('Baby Boy DressUp Free Game by Games For Girls, LLC', 'Games For Girls', 'Baby Boy DressUp Free Game', test);
        doTestRemoveDeveloperName('Baby Boy DressUp Free Game by Games For Girls', 'Games For Girls, LLC', 'Baby Boy DressUp Free Game', test);
        doTestRemoveDeveloperName('Golden Goose-by TouchDelight', 'TouchDelight', 'Golden Goose', test);
        // This is a weakness of the algorithm:
        //doTestRemoveDeveloperName('Grand Press Photo 2012', 'Press', 'Grand Press Photo 2012', test);
        doTestRemoveDeveloperName('Gynécologie, Dr DAVID ELIA', 'Dr DAVID ELIA', 'Gynécologie', test);
        doTestRemoveDeveloperName('Hansel & Gretel Miel Producciones', 'Miel Producciones', 'Hansel & Gretel', test);
        doTestRemoveDeveloperName('Harry and the Haunted House - A Fingerprint Network App', 'Fingerprint', 'Harry and the Haunted House', test);
        doTestRemoveDeveloperName('Joan of Arc - Quelle Histoire - iPhone Version', 'Quelle Histoire', 'Joan of Arc', test);
        doTestRemoveDeveloperName('Nolo\'s Plain English Law Dictionary', 'Nolo', 'Plain English Law Dictionary', test);
        doTestRemoveDeveloperName('Numbers in Spanish with Voice Recording by Tidels.', 'tidels', 'Numbers in Spanish with Voice Recording', test);
        doTestRemoveDeveloperName('Phonak Leo - Interactive Stories', 'Phonak', 'Leo - Interactive Stories', test);
        doTestRemoveDeveloperName('Crazy UFO by Sinoiplay Inc.', 'Sinoiplay Inc.', 'Crazy UFO', test);
        doTestRemoveDeveloperName('Scholastic First Discovery: The Forest for iPad', 'Scholastic', 'First Discovery: The Forest for iPad', test);
        doTestRemoveDeveloperName('THE TORTOISE AND THE HARE. ITBOOK STORY-TOY. HD', 'itbook', 'THE TORTOISE AND THE HARE', test);
        test.done();
    },

    testRemoveAppTypeSuffix: function (test) {
        doTestRemoveAppTypeSuffix('Christmas Match Pairs 2 (Free)', 'Christmas Match Pairs 2', test);
        doTestRemoveAppTypeSuffix('Christmas Memory Match Game HD', 'Christmas Memory Match Game', test);
        doTestRemoveAppTypeSuffix('Christmas Music Tree Free', 'Christmas Music Tree', test);
        //    doTestRemoveAppTypeSuffix('Christmas Music Updated ~ 10,000 FREE !', 'Christmas Music Updated ~ 10,000', test);
        doTestRemoveAppTypeSuffix('Christmas of World Heritage for iPhone', 'Christmas of World Heritage', test);
        doTestRemoveAppTypeSuffix('Christmas Pairs for Kids - for the iPad', 'Christmas Pairs for Kids', test);
        doTestRemoveAppTypeSuffix('Christmas Photo Editor for iPad 2', 'Christmas Photo Editor', test);
        doTestRemoveAppTypeSuffix('Christmas Photo Frames (HD)', 'Christmas Photo Frames', test);
        doTestRemoveAppTypeSuffix('Christmas Stories: Nutcracker Collector\'s Edition HD', 'Christmas Stories: Nutcracker Collector\'s Edition', test);
        doTestRemoveAppTypeSuffix('Christmas Wallpapers HD - 2013 New Year Edition', 'Christmas Wallpapers HD - 2013 New Year Edition', test);
        doTestRemoveAppTypeSuffix('Christmas Wallpapers HD PRO', 'Christmas Wallpapers HD PRO', test);
        doTestRemoveAppTypeSuffix('Chute and Ladder - iPhone Version', 'Chute and Ladder', test);
        doTestRemoveAppTypeSuffix('Cinema Times for iPad, UK', 'Cinema Times for iPad, UK', test);
        doTestRemoveAppTypeSuffix('CircuitzHD Lite', 'CircuitzHD', test);
        doTestRemoveAppTypeSuffix('Joan of Arc - Quelle Histoire - iPhone Version', 'Joan of Arc - Quelle Histoire', test);
        test.done();
    },

    testRemoveParenthesesAtEnd: function (test) {
        doTestRemoveParenthesesAtEnd('Christmas Match Pairs 2 (Free)', 'Christmas Match Pairs 2', test);
        doTestRemoveParenthesesAtEnd('Christmas Photo Frames (HD Free)', 'Christmas Photo Frames', test);
        doTestRemoveParenthesesAtEnd('Christmas Photo Frames (', 'Christmas Photo Frames (', test);
        doTestRemoveParenthesesAtEnd('Christmas Photo Frames (app', 'Christmas Photo Frames (app', test);
        doTestRemoveParenthesesAtEnd('Christmas Photo Frames', 'Christmas Photo Frames', test);
        doTestRemoveParenthesesAtEnd('Christmas (Photo) Frames', 'Christmas (Photo) Frames', test);
        test.done();
    },

    testCreateManagedAppName: function (test) {
        var result = createManagedAppName('Cut the Rope by Zymba (Free)', 'Zymba');
        test.strictEqual(result.originalAppName, 'Cut the Rope by Zymba (Free)');
        test.strictEqual(result.compactAppName, 'Cut the Rope by Zymba');
        test.strictEqual(result.compactAppNameTokens.length, 5);
        test.strictEqual(result.compactAppNameRemade, 'cut the rope by zymba');
        test.strictEqual(result.noDeveloperCompactAppName, 'Cut the Rope');
        test.strictEqual(result.noDeveloperCompactAppNameTokens.length, 3);
        test.strictEqual(result.noDeveloperCompactAppNameRemade, 'cut the rope');
        test.done();
    },
    // TODO more createManagedAppName tests.

    testIsSimilarTo: function (test) {
        var a = createManagedAppName('Cut the Rope', 'Zymba');
        var b = createManagedAppName('Cat the Ripe', 'Zymba');
        test.strictEqual(a.isSimilarTo(b), true);
        test.done();
    },

    testIsSimilarToWhenNotSimilar: function (test) {
        var a = createManagedAppName('Cut the Rope', 'Zymba');
        var b = createManagedAppName('Angel Wings', 'Zymba');
        test.strictEqual(a.isSimilarTo(b), false);
        test.done();
    },
    // TODO more isSimilarTo tests.

    testMatches: function (test) {
        var sentence = new Sentence('Cuts the Ripe is our latest app that you might like!');
        var managedAppName = createManagedAppName('Cut the Rope', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), true);
        test.done();
    },

    testMatches2: function (test) {
        var sentence = new Sentence('Make a Wave is our latest app that you might like!');
        var managedAppName = createManagedAppName('Make a Wave', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), true);
        test.done();
    },

    testMatchesWhenDoesNotMatch: function (test) {
        var sentence = new Sentence('Hamster is our latest app that you might like!');
        var managedAppName = createManagedAppName('Cut the Rope', 'Zymba');
        test.strictEqual(managedAppName.matches(sentence), false);
        test.done();
    }
    // TODO add more matches tests.
};

function doTestNormaliseDeveloperName(developerName, expected, test) {
    test.strictEqual(normaliseDeveloperName(developerName), expected);
}

function doTestRemoveDeveloperName(appName, developerName, expected, test) {
    test.strictEqual(removeDeveloperName(appName, developerName), expected);
}

function doTestRemoveAppTypeSuffix(appName, expected, test) {
    test.strictEqual(removeAppTypeSuffix(appName), expected);
}

function doTestRemoveParenthesesAtEnd(appName, expected, test) {
    test.strictEqual(removeParenthesesAtEnd(appName), expected);
}
