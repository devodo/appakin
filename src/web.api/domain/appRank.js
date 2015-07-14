'use strict';

var MS_PER_DAY = 24*60*60*1000; // hours*minutes*seconds*milliseconds
var POPULARITY_WEIGHT = 0.7;
var RATING_AMPLIFY = 1.05;
var RATING_COUNT_WEIGHT = 0.6;
var CURRENT_COUNT_WEIGHT = 1.5;

var getRating = function(app) {
    var r1 = app.userRating ? parseFloat(app.userRating) : 0;
    var r2 = app.userRatingCurrent ? parseFloat(app.userRatingCurrent) : 0;

    if (r1 === r2 || r2 === 0) {
        return r1;
    }

    if (r1 === 0) {
        return r2;
    }

    var r2Count = app.ratingCountCurrent ? app.ratingCountCurrent : 0;
    var r1Count = app.ratingCount && app.ratingCount > r2Count ? app.ratingCount - r2Count : 0;
    var r1CountWeighted = r1Count ? Math.pow(r1Count, RATING_COUNT_WEIGHT) : 0;
    var r2CountWeighted = r2Count ? Math.pow(r2Count, CURRENT_COUNT_WEIGHT) : 0;
    var countSum = Math.max(1, r1CountWeighted + r2CountWeighted);
    var rating = ((r1 * r1CountWeighted) + (r2 * r2CountWeighted)) / countSum;

    return rating;
};

var getPopularity = function(app) {
    if (!app.ratingCount) {
        return 0;
    }

    var ageDays = Math.max(10, (new Date().getTime() - app.releaseDate.getTime()) / MS_PER_DAY);
    var popularity = Math.min(1.0, RATING_AMPLIFY * (1 - Math.exp(-POPULARITY_WEIGHT * Math.log(1 + (app.ratingCount/ageDays)))));

    return popularity;
};

var logBase = Math.log(10);
var POPULARITY_NORM_FACTOR = 1/2.0;
var normalisePopularity = function(appPopularity) {
    var popularity = (Math.log(1 + appPopularity)/logBase) * POPULARITY_NORM_FACTOR;

    return Math.min(popularity, 1.0);
};

exports.getRating = getRating;
exports.getPopularity = getPopularity;
exports.normalisePopularity = normalisePopularity;
