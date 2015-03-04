'use strict';

var NUM_ITEMS = 1000;
var NUM_USERS = 10000;
var VOTE_PROBABILITY = 0.1;
var INIT_ITEM_SCORE = 100;


var users = [];
var items = [];

function initItems() {
    for (var i = 0; i < NUM_ITEMS; i++) {
        items.push({
            name: 'app:' + i,
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

        users.push({
            name: 'user:' + i,
            score: 0,
            reputation: 0.5,
            votes: votes
        });
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomBool(probability) {
    return Math.random() < probability;
}

function placeRandomVotes() {
    users.forEach(function(user) {
        for (var i = 0; i < NUM_ITEMS; i++) {
            var vote = user.votes[i];

            if (vote.dir !== 0) {
                continue;
            }

            if (getRandomBool(VOTE_PROBABILITY)) {
                vote.dir = getRandomBool(0.5) ? 1 : -1;
                vote.score = items[i].score;
            }
        }
    });
}

function resetUserRepuation() {
    users.forEach(function(user) {
        user.reputation = 1.0;
    });
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

            user.score += ((items[i].score - vote.score) * vote.dir);
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

function printUsers() {
    console.log('users-----------------------');
    users.forEach(function(user) {
        console.log(user);
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
        placeRandomVotes();
        resetUserRepuation();
        var delta = calculateScores();
        print();
        console.log('Delta: ' + delta);
    } else if (key === 'i') {
        var newDelta = calculateScores();
        print();
        console.log('Delta: ' + newDelta);
    } else if (key === 'a') {
        placeRandomVotes();
        resetUserRepuation();

        var epochs = 1;
        var aDelta = calculateScores();
        while (aDelta > 0) {
            epochs++;
            aDelta = calculateScores();
            console.log(aDelta);
        }

        //print();
        console.log('Epochs: ' + epochs);
    }
});





