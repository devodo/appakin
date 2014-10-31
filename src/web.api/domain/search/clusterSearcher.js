'use strict';

var fs = require('fs');
var async = require('async');

var solrClusterCore = require('./solrCore').getClusterCore();
var solrCategoryCore = require('./solrCore').getCategoryCore();
var config = require('../../config');
var adminRepo = require('../../repos/appStoreAdminRepo');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');


var MAX_TERMS = 40;
var USE_BOOST = true;
var BOOST_SMOOTH = 0.95;
var TITLE_POSITION_DECAY = 0.1;
var DESC_POSITION_DECAY = 0.1;
var TERM_FREQ_BOOST = 1.5;
var TITLE_BOOST = 1.1;
var IDF_DECAY = 0.5;

var stopwords = null;

var isStopWord = function(word) {
    if (!stopwords) {
        stopwords = {};
        var contents = fs.readFileSync(config.search.stopwordFile).toString();
        var lines = contents.replace(/\r/g, '').split(/\n/g);
        lines.forEach(function(line) {
            if (line.match(/^\s*#/)) { return; } // ignore commented lines
            stopwords[line] = true;
        });
    }

    return stopwords[word];
};

var searchSimilarByName = function(appId, rows, next) {
    var options = {
        minWordLength: 1,
        minDocFreq: 20,
        minTermFreq: 1,
        maxQueryTerms: 20,
        rows: rows
    };

    searchMlt(appId, "name_stem", options, next);
};

var buildSolrQuery = function(appId, field, options) {
    var solrQuery = 'q=id:' + appId + '&mlt.fl=' + field;

    if (!options) {
        return solrQuery;
    }

    if (options.minWordLength) { solrQuery += '&mlt.minwl=' + options.minWordLength; }
    if (options.minDocFreq) { solrQuery += '&mlt.mindf=' + options.minDocFreq; }
    if (options.minTermFreq) { solrQuery += '&mlt.mintf=' + options.minTermFreq; }
    if (options.maxQueryTerms) { solrQuery += '&mlt.maxqt=' + options.maxQueryTerms; }
    if (options.rows) { solrQuery += '&rows=' + options.rows; }

    return solrQuery;
};

var searchMlt = function(appId, field, options, next) {
    var solrQuery = buildSolrQuery(appId, field, options);

    solrClusterCore.client.get('mlt', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc) {

            var app = {
                id: doc.id,
                name: doc.name_stem,
                score: doc.score
            };

            return app;
        });

        var searhcResult = {
            total: obj.response.numFound,
            apps: apps
        };

        next(null, searhcResult);
    });
};

var parsePositions = function(positionsArray) {
    var positions  = [];

    for (var i = 1; i < positionsArray.length; i+=2) {
        positions.push(positionsArray[i]);
    }

    return positions;
};

var parseTermStats = function(fieldArray, minDocFreq, minTermLength) {
    var termStats = [];

    var numStems = fieldArray.length / 2;

    for (var i = 0; i < numStems; i++) {
        var indexBase = i * 2;
        var term = fieldArray[indexBase];

        if (term.length < minTermLength) {
            continue;
        }

        if (isStopWord(term)) {
            continue;
        }

        var stats = fieldArray[indexBase + 1];
        var docFreq = stats[7];

        if (docFreq < minDocFreq) {
            continue;
        }

        termStats.push({
            term: term,
            termFreq: stats[1],
            positions: parsePositions(stats[3]),
            docFreq: docFreq,
            tfIdf: parseFloat(stats[9])
        });
    }

    return termStats;
};

var getTermStats = function(appId, minDocFreq, minTermLength, next) {
    var solrQuery = 'q=' + appId.replace(/\-/g, '');

    solrClusterCore.client.get('keyword', solrQuery, function (err, obj) {
        if (err) { return next(err); }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var nameStats = parseTermStats(obj.termVectors[3][3], minDocFreq, minTermLength);
        var descStats = parseTermStats(obj.termVectors[3][5], minDocFreq, minTermLength);

        var stats = {
            name: nameStats,
            desc: descStats
        };

        next(null, stats);
    });
};

function logBase(b, n) {
    return Math.log(n) / Math.log(b);
}

var getKeywords = function(appId, next) {
    var minDocFreq = 10;
    var minTermLength = 2;

    getTermStats(appId, minDocFreq, minTermLength, function(err, termStats) {
        if (err) { return next(err); }

        var keywordMap = {};

        termStats.name.forEach(function(term) {
            var tfIdf = 1 / Math.pow(term.docFreq, IDF_DECAY);
            var positionFactor = 1 / (Math.pow(term.positions[0] + 1, TITLE_POSITION_DECAY));
            var score = TITLE_BOOST * tfIdf * positionFactor;

            keywordMap[term.term] = {
                keyword: term.term,
                score: score
            };
        });

        termStats.desc.forEach(function(term) {
            var keyword = keywordMap[term.term];
            if (!keyword) {
                keyword = {
                    keyword: term.term,
                    score: 0
                };
                keywordMap[term.term] = keyword;
            }

            var tfBoost = Math.pow(term.termFreq, TERM_FREQ_BOOST);
            var tfIdf = term.termFreq / Math.pow(term.docFreq / tfBoost, IDF_DECAY);
            var positionFactor = 1 / (Math.pow(term.positions[0] + 1, DESC_POSITION_DECAY));
            var score = tfIdf * positionFactor;

            keyword.score += score;
            keyword.tfIdf = tfIdf;
            keyword.pos = positionFactor;
            keyword.termFreq = term.termFreq;
            keyword.docFreq = term.docFreq;
        });

        var keywords = Object.keys(keywordMap).map(function(key) {
            return keywordMap[key];
        });

        keywords.sort(function(a, b) {
            return b.score - a.score;
        });

        keywords.forEach(function(keyword) {
            var diff = keywords[0].score - keyword.score;
            var smooth = keywords[0].score - (diff * BOOST_SMOOTH);
            keyword.boost = (keyword.score / smooth);
        });

        next(null, keywords);
    });
};

var buildSearchQuery = function(keywords, useBoost, maxTerms) {
    var queryTerms = [];
    for (var i = 0; i < keywords.length && i < maxTerms; i++) {
        if (keywords[i].boost < 0.1) {
            break;
        }

        var queryTerm = solrClusterCore.escapeSpecialChars(keywords[i].keyword);

        if (useBoost) {
            queryTerm += '^' + keywords[i].boost;
        }

        queryTerms.push(queryTerm);
    }

    return encodeURIComponent(queryTerms.join(' '));
};

var searchKeywords = function(appId, keywords, next) {
    var q = buildSearchQuery(keywords, USE_BOOST, MAX_TERMS);
    var solrQuery = 'rows=' + 20 + '&qq=' + q + '&app_id=' + appId;

    solrCategoryCore.client.get('cluster', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var categories = obj.response.docs.map(function(doc) {
            var category = {
                id: doc.id,
                name: doc.cat_name,
                score: doc.score
            };

            return category;
        });

        var searhcResult = {
            total: obj.response.numFound,
            categories: categories
        };

        next(null, searhcResult);
    });
};

var search = function(appId, next) {
    getKeywords(appId, function(err, keywords) {
        if (err) { return next(err); }

        searchKeywords(appId, keywords, next);
    });
};

var runTrainingTest = function(next) {
    adminRepo.getClusterTrainingData(function(err, trainingItems) {
        if (err) { return next(err); }

        var hits = [];
        var misses = [];

        var processItem = function(trainingItem, callback) {
            search(trainingItem.appId, function(err, searchResults) {
                if (err) { return callback(err); }
                var topResult = {
                    expected: trainingItem
                };

                if (searchResults.categories.length > 0) {
                    topResult.result = searchResults.categories[0];

                    var catId = trainingItem.categoryId.replace(/\-/g, '');
                    var isMatch = catId === topResult.result.id;

                    if (isMatch) {
                        hits.push(topResult);
                    } else {
                        misses.push(topResult);
                    }
                }
                else {
                    misses.push(topResult);
                }

                callback();
            });
        };

        async.eachSeries(trainingItems, processItem, function(err) {
            if (err) { return next(err); }

            var testResult = {
                misses: misses,
                hits: hits
            };

            next(null, testResult);
        });
    });
};

var runClusterTest = function(batchSize, next) {
    var processItem = function(app, callback) {
        search(app.extId, function(err, searchResults) {
            if (err) { return callback(err); }

            if (!searchResults.categories || searchResults.categories.length === 0) {
                return callback();
            }

            adminRepo.insertCategoryClusterTest(app.extId, searchResults.categories[0], function (err) {
                callback(err);
            });
        });
    };

    var processBatch = function(lastId) {
        log.debug("Clustring batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                log.debug("Completed clustering.");
                return next();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            async.eachSeries(apps, processItem, function(err) {
                if (err) { return next(err); }

                processBatch(lastId);
            });
        });
    };

    processBatch(0);
};

exports.searchSimilarByName = searchSimilarByName;

exports.getKeywords = function(appId, num, next) {
    getKeywords(appId, function(err, keywords) {
        if (err) { return next(err); }

        next(null, keywords.slice(0, num));
    });
};

exports.search = search;
exports.runTrainingTest = runTrainingTest;
exports.runClusterTest = runClusterTest;





