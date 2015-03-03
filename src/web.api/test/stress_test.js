'use strict';

var prettyHrtime = require('pretty-hrtime');
var request = require('request');
var async = require('async');


var timeRequest = function(url, next) {
    var start = process.hrtime();
    request(url, function (err, response, src) {
        if (err) { return next(err); }

        var end = process.hrtime(start);
        next(null, end);
    });
};

var url = process.argv[2];
var concurrentRequests = parseInt(process.argv[3], 10);
var iterations = parseInt(process.argv[4], 10);
console.log("url: " + url);
console.log("concurrency: " + concurrentRequests + " iterations: " + iterations);


var convertToNano = function(hrtime) {
    return hrtime[0] * 1e9 + hrtime[1];
};

var convertToHrTime = function(nanoTime) {
    var seconds = Math.floor(nanoTime / 1e9);
    var nano = nanoTime - (seconds * 1e9);

    return [seconds, nano];
};

var runSequentialTests = function(name, next) {
    var maxTime = 0;
    var totalTime = 0;

    var recurseLoop = function(count) {
        timeRequest(url, function(err, time) {
            if (err) { return next(err); }

            var timeNano = convertToNano(time);
            if (timeNano > maxTime) {
                maxTime = timeNano;
            }
            totalTime += timeNano;

            console.log(name + " request took: " + prettyHrtime(time));

            if (count === iterations) {
                return next(null, maxTime, totalTime);
            }

            recurseLoop(count + 1);
        });
    };

    recurseLoop(0);
};

var testThread = function(name) {
    runSequentialTests(name, function(err, maxTime, totalTime) {
        if (err) {
            return console.error(err);
        }

        console.log(name + " max time: " + prettyHrtime(convertToHrTime(maxTime)));
        console.log(name + " total time: " + prettyHrtime(convertToHrTime(totalTime)));
    });
};

var runParallelTests = function() {
    for (var i  = 0; i < concurrentRequests; i++) {
        testThread(i);
    }
};

runParallelTests();





