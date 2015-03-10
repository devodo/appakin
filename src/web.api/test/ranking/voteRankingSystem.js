'use strict';

var NUM_ITEMS = 100;
var NUM_USERS = 100;
var VOTE_PROBABILITY = 0.05;
var INIT_ITEM_SCORE = 0.5;
var PERCENT_GOOD_USER = 1.0;
var PERCENT_NEUTRAL_USER = 0.0;
var DELTA_EPSILON = 0.000001;
var VOTE_COST = 0.0;

var INIT_DAMPER = 1;

var users = [];
var items = [];


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
    var goodCount = 0;
    var badCount = 0;

    for (var i = 0; i < NUM_USERS; i++) {
        var votes = [];
        for (var j = 0; j < NUM_ITEMS; j++) {
            votes[j] = {
                dir: 0
            };
        }

        var isNeutral = getRandomBool(PERCENT_NEUTRAL_USER);
        var isGood = getRandomBool(PERCENT_GOOD_USER);

        if (!isNeutral) {
            if (isGood) {
                goodCount++;
            } else {
                badCount++;
            }
        }

        users.push({
            name: 'user:' + i,
            score: 0,
            reputation: 1.0,
            quality: Math.random() * 1.0 + 0.0,
            isNeutral: isNeutral,
            isGood: isGood,
            votes: votes
        });
    }

    console.log('Good: ' + goodCount);
    console.log('Bad: ' + badCount);
}

function placeVotesByQuality() {
    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir !== 0) {
                continue;
            }

            if (getRandomBool(VOTE_PROBABILITY)) {
                var isUpVote = items[i].quality > items[i].score;
                var smartUser = getRandomBool(user.quality);

                if (!smartUser) {
                    isUpVote = !isUpVote;
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

            if (getRandomBool(VOTE_PROBABILITY)) {
                var isUpVote;

                if (user.isNeutral) {
                    isUpVote = getRandomBool(0.5);
                } else {
                    var diff = items[i].quality - items[i].score;
                    var shouldUpVote = diff > 0;

                    if (user.isGood && getRandomBool(user.quality)) {
                        isUpVote = shouldUpVote;
                    } else {
                        isUpVote = !shouldUpVote;
                    }
                }

                var scoreCarry = 0;
                if (vote.dir !== 0) {
                    if ((vote.dir === 1 && isUpVote) || (vote.dir === -1 && !isUpVote)) {
                        continue;
                    }

                    var upvoteWeight = items[i].upvoteWeight;
                    var downvoteWeight = items[i].downvoteWeight;

                    if (vote.dir === 1) {
                        upvoteWeight -= user.reputation;
                    } else {
                        downvoteWeight -= user.reputation;
                    }

                    var itemScore = (upvoteWeight + INIT_DAMPER) /
                        (upvoteWeight + downvoteWeight + INIT_DAMPER);

                    var scoreDiff = (items[i].score - vote.score) * vote.dir;

                    // Remove user influence from score carry
                    scoreCarry = (scoreDiff - VOTE_COST);

                    console.log('Old vote score: ' + vote.score);
                    console.log('Old vote dir: ' + vote.dir);
                    console.log('Score carry: ' + scoreCarry);
                }

                vote.dir = isUpVote ? 1 : -1;
                vote.score = items[i].score + (scoreCarry * vote.dir * -1);

                console.log('Item score: ' + items[i].score);
                console.log('Item quality: ' + items[i].quality);
                console.log('New vote score: ' + vote.score);
                console.log('New vote dir: ' + vote.dir);
                console.log('-------------------------');
            }
        }
    });
}

function resetUserReputation() {
    users.forEach(function(user) {
        user.reputation = 0.5;
    });
}

function resetRandomUserReputation() {
    users.forEach(function(user) {
        user.reputation = Math.random();
    });
}

function calculateItemScores() {
    items.forEach(function(item) {
        item.upvoteWeight = 0;
        item.downvoteWeight = 0;
    });

    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            if (vote.dir === 1) {
                items[i].upvoteWeight += user.reputation;
            } else {
                items[i].downvoteWeight += user.reputation;
            }
        }
    });

    var scoreDelta = 0;

    items.forEach(function(item) {
        var score = (item.upvoteWeight + INIT_DAMPER) /
            (item.upvoteWeight + item.downvoteWeight + INIT_DAMPER + INIT_DAMPER);

        scoreDelta += Math.abs(item.score - score);
        item.score = score;
    });

    return scoreDelta;
}

function calculateUserReputations() {
    var reputationDelta = 0;

    users.forEach(function(user) {
        user.score = 0;
        user.up = 0;
        user.down = 0;

        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            var item = items[i];

            var upvoteWeight = item.upvoteWeight;
            var downvoteWeight = item.downvoteWeight;

            if (vote.dir === 1) {
                upvoteWeight -= user.reputation;
            } else {
                downvoteWeight -= user.reputation;
            }

            var itemScore = (upvoteWeight + INIT_DAMPER) /
                (upvoteWeight + downvoteWeight + INIT_DAMPER);

            var scoreDiff = (items[i].score - vote.score) * vote.dir;

            if (scoreDiff >= 0) {
                user.up += scoreDiff;
            } else {
                user.down += scoreDiff;
            }
        }

        user.down *= -1;

        var reputation = 0;

        // Only users with more ups than downs get reputation
        // so user reset has no effect
        if (user.up > user.down) {
            reputation = user.up / (user.up + user.down);
            // scale between 0 and 1
            reputation = (reputation - 0.5) * 2;
        }

        reputationDelta += Math.abs(user.reputation - reputation);
        user.reputation = reputation;

        if (reputation > 0) {
            user.score = (user.up - user.down) * reputation;
        } else {
            user.score = user.up - user.down;
        }
    });

    return reputationDelta;
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

    var testCopy = items.slice(0).sort(function (a, b) {
        return b.quality - a.quality;
    });

    itemsCopy.sort(function (a, b) {
        return b.score - a.score;
    });

    var scoreError = 0;
    itemsCopy.forEach(function(item, i) {
        var diff = testCopy[i].quality - item.quality;
        scoreError += (diff * diff);
    });

    itemsCopy.sort(function (a, b) {
        var aVoteDiff = a.upvotes - a.downvotes;
        var bVoteDiff = b.upvotes - b.downvotes;
        return bVoteDiff - aVoteDiff;
    });

    var voteError = 0;
    itemsCopy.forEach(function(item, i) {
        var diff = testCopy[i].quality - item.quality;
        voteError += (diff * diff);
    });

    return {
        totalVotes: totalVotes,
        scoreError: scoreError,
        voteError: voteError
    };
}

function scoreConverge() {
    var epochs = 1;
    var scoreDelta = calculateItemScores();
    var reputationDelta = calculateUserReputations();

    while (scoreDelta > DELTA_EPSILON && reputationDelta > DELTA_EPSILON && epochs < 1000) {
        epochs++;

        scoreDelta = calculateItemScores();
        reputationDelta = calculateUserReputations();

        if (epochs % 10 === 0) {
            console.log("Epoch: " + epochs);
        }

        if (epochs > 500) {
            console.log("Score delta: " + scoreDelta);
            console.log("Reputation delta: " + reputationDelta);
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

function printUsersSorted(num, isAsc) {
    console.log('users-----------------------');

    var sortFunc = function (a, b) {
        return b.score - a.score;
    };

    if (isAsc) {
        sortFunc = function (a, b) {
            return a.score - b.score;
        };
    }

    var sortedUser = users.slice(0).sort(sortFunc);

    sortedUser.slice(0, num).forEach(function(user) {
        var voteQuality = 0;

        for (var i = 0; i < NUM_ITEMS; i++) {
            if (user.votes[i].dir === 0) {
                continue;
            }

            voteQuality += (items[i].quality * user.votes[i].dir);
        }

        console.log('name: ' + user.name);
        console.log('score: ' + user.score);
        console.log('is neutral: ' + user.isNeutral);
        console.log('is good: ' + user.isGood);
        console.log('user quality: ' + user.quality);
        console.log('vote quality: ' + voteQuality);
        console.log('reputation: ' + user.reputation);
        console.log('-----------------------');
    });
}

function printItemsSorted(num, isAsc) {
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

    var sortFunc = function (a, b) {
        return b.item.score - a.item.score;
    };

    if (isAsc) {
        sortFunc = function (a, b) {
            return a.item.score - b.item.score;
        };
    }

    sortedItems.sort(sortFunc);

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

    if (key === 'a') {
        placeVotesByTypeWithNoise();
        //resetUserReputation();
        var epochs = scoreConverge();
        console.log('Epochs: ' + epochs);
    } else if (key === 'p') {
        print();
    } else if (key === 'u') {
        printUsersSorted(100);
    } else if (key === 'l') {
        printItemsSorted(100);
    } else if (key === 'x') {
        resetUserReputation();
        console.log('Epochs: ' + scoreConverge());
    } else if (key === 'e') {
        printErrors();
    }
});





