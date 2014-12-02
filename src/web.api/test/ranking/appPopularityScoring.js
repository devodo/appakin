'use strict';

var ratings =
    [
        {r: 2, c: 10},
        {r: 2, c: 100},
        {r: 2, c: 1000},
        {r: 2, c: 10000},
        {r: 2, c: 59000},
        {r: 2.5, c: 10},
        {r: 2.5, c: 100},
        {r: 2.5, c: 1000},
        {r: 2.5, c: 10000},
        {r: 2.5, c: 59000},
        {r: 3.5, c: 10},
        {r: 3.5, c: 100},
        {r: 3.5, c: 1000},
        {r: 3.5, c: 2000},
        {r: 3.5, c: 10000},
        {r: 3.5, c: 59000},
        {r: 4, c: 10},
        {r: 4, c: 100},
        {r: 4, c: 1000},
        {r: 4, c: 2000},
        {r: 4, c: 10000},
        {r: 4, c: 59000},
        {r: 4.5, c: 10},
        {r: 4.5, c: 100},
        {r: 4.5, c: 1000},
        {r: 4.5, c: 2000},
        {r: 4.5, c: 10000},
        {r: 4.5, c: 59000},
        {r: 5, c: 10},
        {r: 5, c: 100},
        {r: 5, c: 1000},
        {r: 5, c: 2000},
        {r: 5, c: 10000},
        {r: 5, c: 24521},
        {r: 5, c: 59000}
    ];

var logBase = function(v,b) {
    return Math.log(v)/Math.log(b);
};

var score = function(rating) {
    var l = logBase(rating.c, 100);
    var p = Math.pow(l, 2);
    var score = rating.r * (1 + p);
    return score;
};

ratings.forEach(function(rating) {
    console.log(rating.r + '\t' + rating.c + ':\t' + score(rating));
});

/*
for (var i = 1; i <= 240; i++) {
    var val = 1 -(Math.pow(logBase(i, 10000),2));
    console.log(i + ": " + val);
    console.log(i + ": " + 1/Math.pow(i, 0.08));
}
*/



