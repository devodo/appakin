'use strict';

var fs = require('fs');
var async = require('async');

var solrClusterCore = require('./solrCore').getClusterCore();
var solrCategoryCore = require('./solrCore').getCategoryCore();
var config = require('../../config');
var adminRepo = require('../../repos/appStoreAdminRepo');
var appStoreRepo = require('../../repos/appStoreRepo');
var classifierRepo = require('../../repos/classificationRepo');
var log = require('../../logger');
var classifier = require('./classifier');


var MAX_TERMS = 50;
var USE_BOOST = true;
var BOOST_SMOOTH = 0.8;
var TITLE_POSITION_DECAY = 0.1;
var DESC_POSITION_DECAY = 0.3;
var TERM_FREQ_BOOST = 1.2;
var TITLE_BOOST = 1.5;
var TITLE_IDF_FACTOR = 0.5;
var DESC_IDF_FACTOR = 0.3;

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

var parseTermVector = function(fieldArray) {
    var termStats = [];

    var numStems = fieldArray.length / 2;

    for (var i = 0; i < numStems; i++) {
        var indexBase = i * 2;
        var term = fieldArray[indexBase];

        var stats = fieldArray[indexBase + 1];
        var docFreq = stats[7];

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

var getTermVectors = function(appId, next) {
    var solrQuery = 'q=' + appId.replace(/\-/g, '');

    solrClusterCore.client.get('keyword', solrQuery, function (err, obj) {
        if (err) { return next(err); }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var nameStats = parseTermVector(obj.termVectors[3][3]);
        var descStats = parseTermVector(obj.termVectors[3][5]);

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

    getTermVectors(appId, function(err, termStats) {
        if (err) { return next(err); }

        var keywordMap = {};

        termStats.name.forEach(function(term) {
            var tfIdf = 1 / Math.pow(term.docFreq, TITLE_IDF_FACTOR);
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
            var tfIdf = tfBoost / Math.pow(term.docFreq, DESC_IDF_FACTOR);
            var positionFactor = 1 / (Math.pow(term.positions[0] + 1, DESC_POSITION_DECAY));
            var score = tfIdf * positionFactor;

            keyword.score += score;
            keyword.score = logBase(10, keyword.score + 1);
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

var buildSeedTermVectorQuery = function(seedSearch) {
    var queryLines = seedSearch.query.
        replace(/\r/g,'').
        split(/\n/g).
        filter(function(line) { //remove blank lines and comments
            return line.trim() === '' || !line.match(/^\s*#/);
        });

    var queryTerms = encodeURIComponent(queryLines.join(' '));
    return queryTerms;
};

var searchTermVectors = function(query, skip, take, next) {
    var solrQuery = 'q=' + query + '&rows=' + take + '&start=' + skip;

    solrClusterCore.client.get('keyword', solrQuery, function (err, obj) {
        if (err) { return next(err); }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var total = (obj.termVectors.length - 2) / 2;

        var docs = [];

        for (var i = 1; i <= total; i++) {
            var index = i * 2;
            var id = obj.termVectors[index];
            var nameTermVector = parseTermVector(obj.termVectors[index+1][3]);
            var descTermVector = parseTermVector(obj.termVectors[index+1][5]);

            var doc = {
                id: id,
                name: nameTermVector,
                desc: descTermVector
            };

            docs.push(doc);
        }

        var searchResult = {
            total: obj.response.numFound,
            docs: docs
        };

        next(null, searchResult);
    });
};

var getClassifierAnalyser = function(seedSearches, next) {
    var batchSize = 1000;
    var classifierAnalyser = classifier.createClassifierAnalyser();

    var finish = function(err) {
        if (err) { return next(err); }

        return next(null, classifierAnalyser);
    };

    async.eachSeries(seedSearches, function(seedSearch, callback) {
        var query = buildSeedTermVectorQuery(seedSearch);

        var processBatch = function(batchIndex) {
            log.debug("Retrieving solr term vectors (batch:" + batchIndex +")");
            searchTermVectors(query, batchSize * batchIndex, batchSize, function(err, searchResult) {
                if (err) { return callback(err); }

                searchResult.docs.forEach(function(doc) {
                    classifierAnalyser.addDoc(doc);
                });

                if (searchResult.docs.length < batchSize) {
                    if (classifierAnalyser.totalDocs() !== searchResult.total) {
                        return callback("Expected " + searchResult.total + " docs but was " + classifierAnalyser.totalDocs());
                    }

                    return callback();
                }

                processBatch(batchIndex+1);
            });
        };

        processBatch(0);

    }, finish);
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

var searchKeywords = function(appId, keywords, categoryId, next) {
    var q = buildSearchQuery(keywords, USE_BOOST, MAX_TERMS);
    var solrQuery = 'rows=' + 20 + '&qq=' + q + '&app_id=' + appId;

    if (categoryId) {
        solrQuery += '&fq=id:' + categoryId;
    }

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

var buildSeedQuery = function(seedSearch, boostFactor, includeDetails, skip, take) {
    var queryLines = seedSearch.query.
        replace(/\r/g,'').
        split(/\n/g).
        filter(function(line) { //remove blank lines and comments
            return line.trim() === '' || !line.match(/^\s*#/);
        });

    var queryTerms = encodeURIComponent(queryLines.join(' '));
    var qq = 'qq=' + queryTerms;
    var fl = includeDetails ? 'fl=id,name,desc,genres,popularity,score,screenshot_urls,ipad_screenshot_urls' : 'fl=id';
    var boost = 'b=' + (boostFactor || boostFactor === 0 ? boostFactor : 1);

    if (!skip) {
        skip = 0;
    }

    if (!take) {
        take = 100;
    }

    return qq + '&' + fl + '&' + boost + '&rows=' + take + '&start=' + skip;
};

var searchSeedApps = function(seedSearch, boostFactor, includeDetails, skip, take, next) {
    var solrQuery = buildSeedQuery(seedSearch, boostFactor, includeDetails, skip, take);
    log.debug("Get seed apps: " + solrQuery);

    solrClusterCore.client.get('seed_search', solrQuery, function (err, obj) {
        if (err) { return next(err); }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc, index) {
            var app = {
                position: index + 1,
                extId: doc.id,
                name: doc.name,
                desc: doc.desc,
                genres: doc.genres,
                screenShots: doc.screenshot_urls,
                ipadScreenShots: doc.ipad_screenshot_urls,
                popularity: doc.popularity,
                score: doc.score
            };

            return app;
        });

        var searchResult = {
            total: obj.response.numFound,
            apps: apps
        };

        next(null, searchResult);
    });
};

var getSeedApps = function(seedSearchId, boostFactor, skip, take, next) {
    adminRepo.getSeedSearch(seedSearchId, function(err, seedSearch) {
        if (err) { return next(err); }

        searchSeedApps(seedSearch, boostFactor, true, skip, take, function(err, searchResult) {
            if (err) { return next(err); }

            next(null, searchResult);
        });
    });
};

var getClassificationSearchApps = function(searchId, boostFactor, skip, take, next) {
    adminRepo.getClassificationSearch(searchId, function(err, seedSearch) {
        if (err) { return next(err); }

        searchSeedApps(seedSearch, boostFactor, true, skip, take, function(err, searchResult) {
            if (err) { return next(err); }

            next(null, searchResult);
        });
    });
};

var getClassificationSearchesAnalyser = function(seedCategoryId, next) {
    adminRepo.getClassificationSearches(seedCategoryId, function(err, seedSearches) {
        if (err) { return next(err); }

        getClassifierAnalyser(seedSearches, function(err, analyser) {
            if (err) { return next(err); }

            next(null, analyser);
        });
    });
};

var getSeedCategoryMatrix = function(seedCategoryId, next) {
    log.debug("Retrieving classification searches");
    adminRepo.getSeedSearches(seedCategoryId, function(err, seedSearches) {
        if (err) { return next(err); }

        getClassifierAnalyser(seedSearches, function(err, analyser) {
            if (err) { return next(err); }

            log.debug("Building vector matrix");
            var matrixData = analyser.buildVectorMatrix();
            next(null, matrixData);
        });
    });
};

var getSeedCategoryKeywords = function(seedCategoryId, next) {
    getClassificationSearchesAnalyser(seedCategoryId, function(err, analyser) {
        if (err) { return next(err); }

        var keywords = analyser.getTopTerms(20, 50);
        next(null, keywords);
    });
};

var getAppTopKeywords = function(appExtId, next) {
    getTermVectors(appExtId, function(err, result) {
        if (err) { return next(err); }

        var classifierAnalyser = classifier.createClassifierAnalyser();
        var topTerms = classifierAnalyser.getDocTopTerms(result);
        return next(null, topTerms);
    });
};

var buildTrainingData = function(matrixData, trainingSet) {
    var trainingData = [];

        trainingSet.forEach(function(trainingItem) {
        var appId = trainingItem.appExtId.replace(/\-/g, '');
        var rowIndex = matrixData.docMap[appId];

        if (!rowIndex && rowIndex !== 0) {
            log.warn("Training app not found in seed vector matrix:" + appId);
            return;
        }

        var trainingRow = [];
        trainingRow[0] = matrixData.vectorMatrix[rowIndex];
        trainingRow[1] = trainingItem.include ? 1 : 0;
        trainingData.push(trainingRow);
    });

    return trainingData;
};

var classifySeedCategory = function(seedCategoryId, saveResults, next) {
    getSeedCategoryMatrix(seedCategoryId, function(err, matrixData) {
        if (err) { return next(err); }

        log.debug("Retrieving training data");
        classifierRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {
            if (err) { return next(err); }

            var trainingData = buildTrainingData(matrixData, trainingSet);
            var svm = classifier.createClassifier();

            log.debug("Starting SVM training");
            svm.train(trainingData, function() {
                log.debug("Generating classification results");
                var predictions = svm.predict(matrixData.vectorMatrix);
                var results = [];
                predictions.forEach(function(prediction, index) {
                    results.push({
                        id: matrixData.docIndex[index],
                        result: prediction
                    });
                });

                if (!saveResults) {
                    return next(null, results);
                }

                log.debug("Saving classififcation results to db");
                classifierRepo.setClassificationApps(results, seedCategoryId, function(err) {
                    if (err) { return next(err); }

                    return next(null, results);
                });
            });
        });
    });
};

var getClassificationApps = function(seedCategoryId, isInclude, skip, take, next) {
    classifierRepo.getClassificationApps(seedCategoryId, isInclude, skip, take, function(err, results) {
        if (err) { return next(err); }

        return next(null, results);
    });
};

var insertSeedTraining = function(seedCategoryId, appExtId, isIncluded, next) {
    classifierRepo.insertSeedTraining(seedCategoryId, appExtId, isIncluded, function(err, id) {
        if (err) { return next(err); }

        return next(null, id);
    });
};

var search = function(appId, next) {
    getKeywords(appId, function(err, keywords) {
        if (err) { return next(err); }

        searchKeywords(appId, keywords, null, next);
    });
};

var searchCategory = function(appId, categoryId, next) {
    getKeywords(appId, function(err, keywords) {
        if (err) { return next(err); }

        searchKeywords(appId, keywords, categoryId, next);
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

var runClusterCategoryTest = function(categoryId, extCategoryId, next) {
    var processItem = function(app, callback) {
        getKeywords(app.extId, function(err, keywords) {
            if (err) { return next(err); }

            if (keywords.length === 0) {
                return callback();
            }

            var score = 0;
            keywords.forEach(function(k) {
                score += k.score;
            });

            var keywordResult = {
                id: extCategoryId,
                score: score
            };

            adminRepo.insertCategoryClusterTest(app.extId, keywordResult, function (err) {
                callback(err);
            });
        });
    };


    appStoreRepo.getCategoryAppsForIndex(categoryId, function(err, apps) {
        if (err) {
            return next(err);
        }

        async.eachSeries(apps, processItem, function(err) {
            if (err) { return next(err); }

            log.debug("Completed clustering.");
            return next();
        });
    });
};

exports.searchSimilarByName = searchSimilarByName;

exports.getTopTerms = function(appId, num, next) {
    getKeywords(appId, function(err, keywords) {
        if (err) { return next(err); }

        next(null, keywords.slice(0, num));
    });
};

exports.search = search;
exports.searchCategory = searchCategory;
exports.runTrainingTest = runTrainingTest;
exports.runClusterTest = runClusterTest;
exports.runClusterCategoryTest = runClusterCategoryTest;
exports.getSeedApps = getSeedApps;
exports.getSeedCategoryKeywords = getSeedCategoryKeywords;
exports.getAppTopKeywords = getAppTopKeywords;
exports.classifySeedCategory = classifySeedCategory;
exports.getClassificationApps = getClassificationApps;
exports.insertSeedTraining = insertSeedTraining;




