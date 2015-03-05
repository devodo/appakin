'use strict';

var NUM_ITEMS = 500;
var NUM_USERS = 10000;
var VOTE_PROBABILITY = 0.1;
var INIT_ITEM_SCORE = 100;
var PERCENT_GOOD_USER = 0.7;
var PERCENT_NEUTRAL_USER = 0.5;
var SCORE_SCALING_POWER = 0.5;

var users = [];
var items = [];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomBool(probability) {
    return Math.random() < probability;
}

function initItems() {
    for (var i = 0; i < NUM_ITEMS; i++) {
        items.push({
            name: 'app:' + i,
            quality: Math.random(),
            score: INIT_ITEM_SCORE
        });
    }
}

function initUsers() {
    for (var i = 0; i < NUM_USERS; i++) {
        var votes = [];
        for (var j = 0; j < NUM_ITEMS; j++) {
            votes[j] = {
                dir: 0
            };
        }

        var isNeutral = getRandomBool(PERCENT_NEUTRAL_USER);
        var isGood = getRandomBool(PERCENT_GOOD_USER);

        users.push({
            name: 'user:' + i,
            score: 0,
            reputation: 0.5,
            quality: Math.random(),
            isNeutral: isNeutral,
            isGood: isGood,
            votes: votes
        });
    }
}

function placeVotesByQuality() {
    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir !== 0) {
                continue;
            }

            if (getRandomBool(VOTE_PROBABILITY)) {
                var goodApp = getRandomBool(items[i].quality);
                var smartUser = getRandomBool(user.quality);

                if (!smartUser && getRandomBool(0.5)) {
                    goodApp = !goodApp;
                }

                vote.dir = goodApp ? 1 : -1;

                vote.score = items[i].score;
            }
        }
    });
}

function placeVotesByType() {
    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir !== 0) {
                continue;
            }

            if (getRandomBool(VOTE_PROBABILITY)) {
                var isUpVote;

                if ((!user.isNeutral && user.isGood) || (user.isNeutral && getRandomBool(user.quality))) {
                    isUpVote = getRandomBool(items[i].quality);
                } else {
                    isUpVote = getRandomBool(1.0 - items[i].quality);
                }

                vote.dir = isUpVote ? 1 : -1;
                vote.score = items[i].score;
            }
        }
    });
}

function placeVotesByTypeWithNoise() {
    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir !== 0) {
                continue;
            }

            if (getRandomBool(VOTE_PROBABILITY)) {
                var isUpVote;

                if (user.isNeutral) {
                    isUpVote = getRandomBool(0.5);
                } else if (user.isGood) {
                    isUpVote = getRandomBool(items[i].quality);
                } else {
                    isUpVote = getRandomBool(1.0 - items[i].quality);
                }

                vote.dir = isUpVote ? 1 : -1;
                vote.score = items[i].score;
            }
        }
    });
}

function resetUserReputation() {
    users.forEach(function(user) {
        user.reputation = 1.0;
    });
}

function scaleScore(score) {
    var scaledScore = Math.pow(Math.abs(score), SCORE_SCALING_POWER);

    if (score < 0) {
        scaledScore *= -1;
    }

    return scaledScore;
}

function calculateScores() {
    items.forEach(function(item) {
        item.score = INIT_ITEM_SCORE;
    });

    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            items[i].score += (vote.dir * user.reputation);
        }
    });

    users.forEach(function(user) {
        user.score = 0;

        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            var deltaScore = scaleScore(items[i].score) - scaleScore(vote.score);
            user.score += (deltaScore * vote.dir);
        }
    });

    var totalUsers = NUM_USERS;
    var totalDelta = 0;
    users.forEach(function(user) {
        if (user.score <= 0) {
            totalDelta += Math.abs(user.reputation);
            user.reputation = 0;
            totalUsers--;
            return;
        }
    });

    users.forEach(function(user) {
        if (user.score <= 0) {
            return;
        }

        // Must ignore users with score below 0
        // so user resets have no impact
        var percentileCount = -1;
        for (var i = 0; i < NUM_USERS; i++) {
            if (users[i].score >= user.score) {
                percentileCount++;
            }
        }

        var reputation = 1.0 - (percentileCount/totalUsers);
        totalDelta += Math.abs(user.reputation - reputation);
        user.reputation = reputation;
    });

    return totalDelta;
}

function calculateScoreError() {
    var itemsCopy = items.slice(0);
    var totalVotes = 0;

    for (var i = 0; i < NUM_ITEMS; i++) {
        var upvotes = 0;
        var downvotes = 0;

        for (var j = 0; j < NUM_USERS; j++) {
            if (users[j].votes[i].dir === 1) {
                upvotes++;
            } else if (users[j].votes[i].dir === -1) {
                downvotes++;
            }
        }

        totalVotes += (upvotes + downvotes);
        itemsCopy[i].upvotes = upvotes;
        itemsCopy[i].downvotes = downvotes;
    }

    itemsCopy.sort(function (a, b) {
        return b.quality - a.quality;
    });

    var itemIndexMap = Object.create(null);
    itemsCopy.forEach(function(item, i) {
        itemIndexMap[item.name] = i;
    });

    itemsCopy.sort(function (a, b) {
        return b.score - a.score;
    });

    var scoreError = 0;
    itemsCopy.forEach(function(item, i) {
        var correctIndex = itemIndexMap[item.name];
        scoreError += Math.abs(correctIndex - i);
    });

    itemsCopy.sort(function (a, b) {
        var aVoteDiff = a.upvotes - a.downvotes;
        var bVoteDiff = b.upvotes - b.downvotes;
        return bVoteDiff - aVoteDiff;
    });

    var voteError = 0;
    itemsCopy.forEach(function(item, i) {
        var correctIndex = itemIndexMap[item.name];
        voteError += Math.abs(correctIndex - i);
    });

    return {
        totalVotes: totalVotes,
        scoreError: scoreError,
        voteError: voteError
    };
}

function scoreConverge() {
    var epochs = 1;
    var aDelta = calculateScores();
    while (aDelta > 0 && epochs < 2000) {
        epochs++;
        aDelta = calculateScores();
        if (epochs % 10 === 0) {
            console.log("Epoch: " + epochs);
        }

        if (epochs > 500) {
            console.log("Delta: " + aDelta);
        }
    }

    return epochs;
}

function printUsers() {
    console.log('users-----------------------');
    users.forEach(function(user) {
        console.log(user);
        console.log('-----------------------');
    });
}

function printUsersSorted(num) {
    console.log('users-----------------------');
    var sortedUser = users.map(function(user) {
        return user;
    });

    sortedUser.sort(function (a, b) {
        return b.score - a.score;
    });

    sortedUser.slice(0, num).forEach(function(user) {
        console.log('name: ' + user.name);
        console.log('score: ' + user.score);
        console.log('quality: ' + user.quality);
        console.log('reputation: ' + user.reputation);
        console.log('-----------------------');
    });
}

function printItemsSorted(num) {
    console.log('items-----------------------');
    var sortedItems = [];

    for (var i = 0; i < NUM_ITEMS; i++) {
        var upvotes = 0;
        var downvotes = 0;

        for (var j = 0; j < NUM_USERS; j++) {
            if (users[j].votes[i].dir === 1) {
                upvotes++;
            } else if (users[j].votes[i].dir === -1) {
                downvotes++;
            }
        }

        sortedItems.push({
            item: items[i],
            upvotes: upvotes,
            downvotes: downvotes
        });
    }

    sortedItems.sort(function (a, b) {
        return b.item.score - a.item.score;
    });

    sortedItems.slice(0, num).forEach(function(item) {
        console.log('name: ' + item.item.name);
        console.log('score: ' + item.item.score);
        console.log('quality: ' + item.item.quality);
        console.log('upvotes: ' + item.upvotes);
        console.log('downvotes: ' + item.downvotes);
        console.log('-----------------------');
    });
}

function printItems() {
    console.log('items-----------------------');
    items.forEach(function(item) {
        console.log(item);
        console.log('-----------------------');
    });
}

function printErrors() {
    var result = calculateScoreError();

    console.log('errors-----------------------');
    console.log('total votes: ' + result.totalVotes);
    console.log('score error: ' + result.scoreError);
    console.log('vote error: ' + result.voteError);
}

function print() {
    printUsers();
    printItems();
}

initItems();
initUsers();


var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding( 'utf8' );

// on any data into stdin
stdin.on( 'data', function( key ){
    // ctrl-c ( end of text )
    if ( key === '\u0003' ) {
        process.exit();
    }
    // write the key to stdout all normal like
    process.stdout.write( key );

    if (key === 'v') {
        placeVotesByQuality();
        resetUserReputation();
        var delta = calculateScores();
        print();
        console.log('Delta: ' + delta);
    } else if (key === 'i') {
        var newDelta = calculateScores();
        print();
        console.log('Delta: ' + newDelta);
    } else if (key === 'a') {
        placeVotesByTypeWithNoise();
        resetUserReputation();
        var epochs = scoreConverge();
        console.log('Epochs: ' + epochs);
    } else if (key === 'p') {
        printUsersSorted(10);
    } else if (key === 'l') {
        printItemsSorted(10);
    } else if (key === 'x') {
        resetUserReputation();
        console.log('Epochs: ' + scoreConverge());
    } else if (key === 'e') {
        printErrors();
    }
});





