'use strict';

var patternMatching = require('../../../domain/analysis/patternMatching');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testGetTextTitle: function (test) {
        doTestGetTextTitle('foo', '', test);
        doTestGetTextTitle('foo bat bar', '', test);
        doTestGetTextTitle('foo: bar', 'foo', test);
        doTestGetTextTitle('foo bat : bar', 'foo bat', test);
        doTestGetTextTitle('foo bat :bar', 'foo bat', test);
        doTestGetTextTitle('foo bat: bar', 'foo bat', test);
        doTestGetTextTitle('foo bat - bar', 'foo bat', test);
        doTestGetTextTitle('foo bat -bar', 'foo bat', test);
        doTestGetTextTitle('Little Fox Music Box – Kids songs – Sing along', 'Little Fox Music Box', test);
        test.done();
    },

    testHasSomeAlphaNumericContent: function (test) {
        doTestHasSomeAlphaNumericContent('foo', true, test);
        doTestHasSomeAlphaNumericContent('á', true, test);
        doTestHasSomeAlphaNumericContent('22', true, test);
        doTestHasSomeAlphaNumericContent('=', false, test);
        doTestHasSomeAlphaNumericContent('"', false, test);
        doTestHasSomeAlphaNumericContent('  ', false, test);
        test.done();
    },

    testEscapeForInclusionInRegex: function (test) {
        test.strictEqual(patternMatching.escapeForInclusionInRegex('.'), '\\.');
        test.done();
    },

    testRemoveEndParentheses: function (test) {
        doTestRemoveEndParentheses('Christmas Match Pairs 2 (Free)', 'Christmas Match Pairs 2', test);
        doTestRemoveEndParentheses('Christmas Photo Frames (HD Free)', 'Christmas Photo Frames', test);
        doTestRemoveEndParentheses('Christmas Photo Frames (', 'Christmas Photo Frames (', test);
        doTestRemoveEndParentheses('Christmas Photo Frames (app', 'Christmas Photo Frames (app', test);
        doTestRemoveEndParentheses('Christmas Photo Frames', 'Christmas Photo Frames', test);
        doTestRemoveEndParentheses('(Christmas Photo Frames)', '(Christmas Photo Frames)', test);
        doTestRemoveEndParentheses('Christmas (Photo) Frames', 'Christmas (Photo) Frames', test);
        test.done();
    },

    testRemoveCompanyNameSuffix: function (test) {
        doTestRemoveCompanyNameSuffix('Zylo Ltd', 'Zylo', test);
        doTestRemoveCompanyNameSuffix('Zylo Ltd.', 'Zylo', test);
        doTestRemoveCompanyNameSuffix('Zylo ltd.', 'Zylo', test);
        doTestRemoveCompanyNameSuffix('Zylo ltd', 'Zylo', test);
        doTestRemoveCompanyNameSuffix('Zylo LLC', 'Zylo', test);
        doTestRemoveCompanyNameSuffix('Zylo Boo llc.', 'Zylo Boo', test);
        doTestRemoveCompanyNameSuffix('Spotify', 'Spotify', test);
        doTestRemoveCompanyNameSuffix('Less Spotify', 'Less Spotify', test);
        doTestRemoveCompanyNameSuffix('Spotify, LLC', 'Spotify', test);
        doTestRemoveCompanyNameSuffix('Spotify LLC', 'Spotify', test);
        doTestRemoveCompanyNameSuffix('Spot ify, Ltd', 'Spot ify', test);
        doTestRemoveCompanyNameSuffix('Spotify    Ltd', 'Spotify', test);
        test.done();
    },

    testRemoveAppTypeSuffix: function (test) {
        doTestRemoveAppTypeSuffix('' , '', test);
        doTestRemoveAppTypeSuffix('   ' , '   ', test);
        doTestRemoveAppTypeSuffix('Cut the Rope lite' , 'Cut the Rope', test);
        doTestRemoveAppTypeSuffix('Cut the Rope lite!' , 'Cut the Rope', test);
        doTestRemoveAppTypeSuffix('Cut the Rope for the iPAD 2 !' , 'Cut the Rope', test);
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
    }
};

function doTestGetTextTitle(input, expected, test) {
    test.strictEqual(patternMatching.getTextTitle(input), expected, input);
}

function doTestHasSomeAlphaNumericContent(input, expected, test) {
    test.strictEqual(patternMatching.hasSomeAlphaNumericContent(input), expected, input);
}

function doTestRemoveEndParentheses(input, expected, test) {
    test.strictEqual(patternMatching.removeEndParentheses(input), expected, input);
}

function doTestRemoveCompanyNameSuffix(input, expected, test) {
    test.strictEqual(patternMatching.removeCompanyNameSuffix(input), expected, input);
}

function doTestRemoveAppTypeSuffix(input, expected, test) {
    test.strictEqual(patternMatching.removeAppTypeSuffix(input), expected, input);
}

function doTestRemoveDeveloperName(appName, developerName, expected, test) {
    test.strictEqual(patternMatching.removeDeveloperName(appName, developerName), expected, appName + ' ' + developerName);
}
