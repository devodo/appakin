'use strict';

var NUM_ITEMS = 100;
var NUM_USERS = 100;
var INIT_REPUTATION = 1 / NUM_USERS;
var VOTE_PROBABILITY = 0.05;
var INIT_ITEM_SCORE = 0;
var PERCENT_GOOD_USER = 1.0;
var PERCENT_NOISE_USER = 0.0;
var DELTA_EPSILON = 0.000001;
var VOTE_COST = 0.0;

var INIT_DAMPER = 1;

var users = [];
var items = [];

var User = function(name, quality, isGood, isNoise) {
    this.name = name;
    this.quality = quality;
    this.isGood = isGood;
    this.isNoise = isNoise;
    this.votes = [];
    this.voteCount = 0;
    this.reputation = INIT_REPUTATION;
    this.score = 0;

    for (var j = 0; j < NUM_ITEMS; j++) {
        this.votes[j] = {
            dir: 0
        };
    }
};

var Item = function(name, quality) {
    this.name = name;
    this.quality = quality;
    this.score = INIT_ITEM_SCORE;
};


function getRandomBool(probability) {
    return Math.random() < probability;
}

function initItems() {
    for (var i = 0; i < NUM_ITEMS; i++) {
        items.push(
            new Item('app:' + i, Math.random()));
    }
}

function initUsers() {
    var goodCount = 0;
    var badCount = 0;
    var noiseCount = 0;

    for (var i = 0; i < NUM_USERS; i++) {
        var quality = Math.random() * 0.5 + 0.5;
        var isGood = getRandomBool(PERCENT_GOOD_USER);

        var isNoise = getRandomBool(PERCENT_NOISE_USER);

        if (isNoise) {
            quality = 0.5;
            isGood = true;
            noiseCount++;
        } else {
            if (isGood) {
                goodCount++;
            } else {
                badCount++;
            }
        }

        var user = new User('user:' + i, quality, isGood, isNoise);
        users.push(user);
    }

    console.log('Good: ' + goodCount);
    console.log('Bad: ' + badCount);
    console.log('Noise: ' + noiseCount);
}

User.prototype.getVoteWeight = function() {
    return this.reputation / this.voteCount;
};

User.prototype.getItemScore = function(itemIndex) {
    var self = this;

    var vote = self.votes[itemIndex];
    var item = items[itemIndex];

    //if (!vote) {
        return item.score;
    //}

    var upvoteWeight = item.upvoteWeight;
    var downvoteWeight = item.downvoteWeight;

    if (vote.dir === 1) {
        upvoteWeight -= self.reputation;
    } else {
        downvoteWeight -= self.reputation;
    }

    var itemScore = (upvoteWeight + INIT_DAMPER) /
        (upvoteWeight + downvoteWeight + INIT_DAMPER);

    return itemScore;
};

User.prototype.placeVotes = function() {
    var self = this;
    for (var i = 0; i < NUM_ITEMS; i++) {
        var item = items[i];
        var vote = self.votes[i];

        if (getRandomBool(VOTE_PROBABILITY)) {
            var itemScore = self.getItemScore(i);

            var isUpVote;

            if (self.isNoise) {
                isUpVote = getRandomBool(0.5);
            } else {
                var diff = item.quality - itemScore;
                var shouldUpVote = diff > 0;

                if (self.isGood && getRandomBool(self.quality)) {
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

                var scoreDiff = (itemScore - vote.score) * vote.dir;
                scoreCarry = (scoreDiff - VOTE_COST);

                console.log('Old vote score: ' + vote.score);
                console.log('Old vote dir: ' + vote.dir);
                console.log('Score carry: ' + scoreCarry);
            } else {
                self.voteCount++;
            }

            vote.dir = isUpVote ? 1 : -1;
            vote.score = items[i].score + (scoreCarry * vote.dir * -1);

            console.log('Item score: ' + itemScore);
            console.log('Item quality: ' + item.quality);
            console.log('New vote score: ' + vote.score);
            console.log('New vote dir: ' + vote.dir);
            console.log('-------------------------');
        }
    }
};

function resetUserReputation() {
    users.forEach(function(user) {
        user.reputation = INIT_REPUTATION;
    });
}

function calculateItemScores() {
    items.forEach(function(item) {
        item.upvoteWeight = 0;
        item.downvoteWeight = 0;
    });

    users.forEach(function(user) {
        var voteWeight = user.getVoteWeight();

        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            if (vote.dir === 1) {
                items[i].upvoteWeight += voteWeight;
            } else {
                items[i].downvoteWeight += voteWeight;
            }
        }
    });

    var scoreDelta = 0;

    items.forEach(function(item) {
        var score = 0;
        if (item.upvoteWeight > 0) {
            score = item.upvoteWeight / (item.upvoteWeight + item.downvoteWeight);
        }

        scoreDelta += Math.abs(item.score - score);
        item.score = score;
    });

    return scoreDelta;
}

function calculateUserReputations() {
    var reputationDelta = 0;
    var totalScore = 0;

    users.forEach(function(user) {
        user.score = 0;
        user.up = 0;
        user.down = 0;

        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir === 0) {
                continue;
            }

            var itemScore = user.getItemScore(i);
            var scoreDiff = (itemScore - vote.score) * vote.dir;
            user.score += scoreDiff;

            if (scoreDiff >= 0) {
                user.up += scoreDiff;
            } else {
                user.down += scoreDiff;
            }
        }

        user.down *= -1;

        if (user.score > 0) {
            totalScore += user.score;
        }
    });

    users.forEach(function(user) {
        var reputation = 0;

        if (user.score > 0) {
            reputation = user.score / totalScore;
        }

        reputationDelta += Math.abs(user.reputation - reputation);
        user.reputation = reputation;
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
        console.log('is noise: ' + user.isNoise);
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
        users.forEach(function(user) {
            user.placeVotes();
        });

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





