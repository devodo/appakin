'use strict';

var NUM_ITEMS = 100;
var NUM_USERS = 100;
var INIT_REPUTATION = 1 / NUM_USERS;
var VOTE_PROBABILITY = 0.05;
var PERCENT_GOOD_USER = 1.0;
var PERCENT_NOISE_USER = 0.0;
var DELTA_EPSILON = 0.000001;
var VOTE_COST = 0.0;

var ITEM_INIT_VOTE_WEIGHT = INIT_REPUTATION * 10 / NUM_ITEMS;

var users = [];
var items = [];

var User = function(index, quality, isGood, isNoise) {
    this.index = index;
    this.name = 'user:' + index;
    this.quality = quality;
    this.isGood = isGood;
    this.isNoise = isNoise;
    this.votes = [];
    this.voteCount = 0;
    this.reputation = INIT_REPUTATION;
    this.score = 0;

    for (var j = 0; j < NUM_ITEMS; j++) {
        this.votes[j] = null;
    }
};

var Item = function(index, quality) {
    this.index = index;
    this.name = 'app:' + index;
    this.quality = quality;
    this.upvoteWeight = ITEM_INIT_VOTE_WEIGHT;
    this.downvoteWeight = ITEM_INIT_VOTE_WEIGHT;
    this.score = this.upvoteWeight / (this.upvoteWeight + this.downvoteWeight);

    this.votes = [];
    this.voteCount = 0;

    for (var j = 0; j < NUM_USERS; j++) {
        this.votes[j] = null;
    }
};

var Vote = function(item, user) {
    this.item = item;
    this.user = user;
};

function getRandomBool(probability) {
    return Math.random() < probability;
}

function initItems() {
    for (var i = 0; i < NUM_ITEMS; i++) {
        items.push(
            new Item(i, Math.random()));
    }
}

function initUsers() {
    var goodCount = 0;
    var badCount = 0;
    var noiseCount = 0;

    for (var i = 0; i < NUM_USERS; i++) {
        var quality = Math.random() * 1.0 + 0.0;
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

        var user = new User(i, quality, isGood, isNoise);
        users.push(user);
    }

    console.log('Good: ' + goodCount);
    console.log('Bad: ' + badCount);
    console.log('Noise: ' + noiseCount);
}

Vote.prototype.getScoreExcludingVote = function() {
    var self = this;

    return self.item.getScoreExcludingVote(self);
};

User.prototype.getVoteWeight = function() {
    return this.reputation / this.voteCount;
};

User.prototype.addVote = function(vote) {
    var self = this;

    if (self.votes[vote.item.index]) {
        throw "Vote already added";
    }

    self.voteCount++;
    self.votes[vote.item.index] = vote;
};

Item.prototype.addVote = function(vote) {
    var self = this;

    if (self.votes[vote.user.index]) {
        throw "Vote already added";
    }

    var voteWeight = vote.user.getVoteWeight();

    if (vote.dir === 1) {
        self.upvoteWeight += voteWeight;
    } else {
        self.downvoteWeight += voteWeight;
    }

    self.score = self.upvoteWeight / (self.upvoteWeight + self.downvoteWeight);

    self.voteCount++;
    self.votes[vote.user.index] = vote;
};

Item.prototype.removeVote = function(vote) {
    var self = this;

    if (!self.votes[vote.user.index]) {
        throw "Error attempt to remove vote that does not exist";
    }

    var voteWeight = vote.user.getVoteWeight();

    if (vote.dir === 1) {
        self.upvoteWeight -= voteWeight;
    } else {
        self.downvoteWeight -= voteWeight;
    }

    self.score = self.upvoteWeight / (self.upvoteWeight + self.downvoteWeight);
    self.votes[vote.user.index] = null;
};

Item.prototype.getScoreExcludingVote = function(vote) {
    var self = this;

    if (!vote) {
        return self.score;
    }

    var voteWeight = vote.user.getVoteWeight();
    var upvoteWeight = self.upvoteWeight;
    var downvoteWeight = self.downvoteWeight;

    if (vote.dir === 1) {
        upvoteWeight -= voteWeight;
    } else {
        downvoteWeight -= voteWeight;
    }

    return upvoteWeight / (upvoteWeight + downvoteWeight);
};

Item.prototype.recalculateScore = function() {
    var self = this;

    self.upvoteWeight = ITEM_INIT_VOTE_WEIGHT;
    self.downvoteWeight = ITEM_INIT_VOTE_WEIGHT;

    for (var i = 0; i < NUM_USERS; i++) {
        var vote = self.votes[i];

        if (!vote) {
            continue;
        }

        var voteWeight = vote.user.getVoteWeight();

        if (vote.dir === 1) {
            self.upvoteWeight += voteWeight;
        } else {
            self.downvoteWeight += voteWeight;
        }
    }

    var score = self.upvoteWeight / (self.upvoteWeight + self.downvoteWeight);
    var scoreDelta = Math.abs(self.score - score);
    self.score = score;

    return scoreDelta;
};

User.prototype.recalculateScore = function() {
    var self = this;

    self.score = 0;
    self.up = 0;
    self.down = 0;

    for (var i = 0; i < NUM_ITEMS; i++) {
        var vote = self.votes[i];

        if (!vote) {
            continue;
        }

        var scoreDiff = (vote.item.score - vote.score) * vote.dir;
        self.score += scoreDiff;

        if (scoreDiff >= 0) {
            self.up += scoreDiff;
        } else {
            self.down -= scoreDiff;
        }
    }

    return self.score;
};

User.prototype.placeVotes = function() {
    var self = this;
    for (var i = 0; i < NUM_ITEMS; i++) {
        var item = items[i];
        var vote = self.votes[i];
        var originalItemScore = item.score;

        if (getRandomBool(VOTE_PROBABILITY)) {
            var isUpVote;

            if (self.isNoise) {
                isUpVote = getRandomBool(0.5);
            } else {
                var diff = item.quality - item.score;
                var shouldUpVote = diff > 0;

                if (self.isGood && getRandomBool(self.quality)) {
                    isUpVote = shouldUpVote;
                } else {
                    isUpVote = !shouldUpVote;
                }
            }

            var scoreCarry = 0;
            if (vote) {
                if ((vote.dir === 1 && isUpVote) || (vote.dir === -1 && !isUpVote)) {
                    continue;
                }

                var scoreDiff = (item.score - vote.score) * vote.dir;
                scoreCarry = (scoreDiff - VOTE_COST);
                item.removeVote(vote);

                console.log('Old vote score: ' + vote.score);
                console.log('Old vote dir: ' + vote.dir);
                console.log('Score carry: ' + scoreCarry);
            } else {
                vote = new Vote(item, self);
                self.addVote(vote);
            }

            vote.dir = isUpVote ? 1 : -1;
            item.addVote(vote);
            vote.score = item.score + (scoreCarry * vote.dir * -1);

            console.log('Original item score: ' + originalItemScore);
            console.log('New item score: ' + item.score);
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
    var scoreDelta = 0;

    items.forEach(function(item) {
        scoreDelta += item.recalculateScore();
    });

    return scoreDelta;
}

function calculateUserReputations() {
    var reputationDelta = 0;
    var totalScore = 0;

    users.forEach(function(user) {
        var score = user.recalculateScore();

        if (score > 0) {
            totalScore += score;
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
            if (!users[j].votes[i]) {
                continue;
            }

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
            if (!user.votes[i]) {
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
            if (!users[j].votes[i]) {
                continue;
            }

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





