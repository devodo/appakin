"use strict";

var stringUtil = require('../../domain/stringUtil');

exports.group = {
    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testStripDashes: function (test) {
        var testUuid = "623db414-9d72-49d5-b107-469c04b97f4f";
        var expectedResult = "623db4149d7249d5b107469c04b97f4f";
        var result = stringUtil.stripDashes(testUuid);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails1: function (test) {
        var testString = "This is a http://www.google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails2: function (test) {
        var testString = "This is a www.google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails3: function (test) {
        var testString = "This is a http://google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails4: function (test) {
        var testString = "This is a https://www.google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails5: function (test) {
        var testString = "This is a google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails6: function (test) {
        var testString = "This is a test@google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails6b: function (test) {
        var testString = "This is a another_test@google.com test";
        var expectedResult = "This is a  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails7: function (test) {
        var testString = "This is a url http://www.google.com/ and email test@google.co.uk test";
        var expectedResult = "This is a url  and email  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripUrlsAndEmails8: function (test) {
        var testString = "Follow us at twitter.com/blah test";
        var expectedResult = "Follow us at  test";
        var result = stringUtil.stripUrlsAndEmails(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripSocialMedia1: function (test) {
        var testString = "Please follow us on twitter now";
        var expectedResult = "Please  now";
        var result = stringUtil.stripSocialMedia(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripSocialMedia2: function (test) {
        var testString = "Please like us on facebook now";
        var expectedResult = "Please  now";
        var result = stringUtil.stripSocialMedia(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    },

    testStripIndex: function (test) {
        var testString = "Please like us on facebook now at www.facebook.com";
        var expectedResult = "Please  now at ";
        var result = stringUtil.stripForIndex(testString);
        test.expect(1);
        test.equal(result, expectedResult);
        test.done();
    }
};
