'use strict';

var fs = require('fs');
var async = require('async');

var solrClusterCore = require('./solrCore').getClusterCore();
var config = require('../../config');
var adminRepo = require('../../repos/appStoreAdminRepo');
var classifierRepo = require('../../repos/classificationRepo');
var log = require('../../logger');
var classifier = require('./classifier');


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

var getTermVectorIndex = function(termVectors, termName) {
    for (var i = 0; i < termVectors.length; i++) {
        if (termVectors[i] === termName) {
            return i + 1;
        }
    }

    return -1;
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

            var nameIndex = getTermVectorIndex(obj.termVectors[index+1], "name_shingle");
            var nameTermVector = nameIndex > -1 ? parseTermVector(obj.termVectors[index+1][nameIndex]): [];

            var descIndex = getTermVectorIndex(obj.termVectors[index+1], "desc_shingle");
            var descTermVector = descIndex > -1 ? parseTermVector(obj.termVectors[index+1][descIndex]): [];

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

var getClassifierAnalyser = function(trainingSet, next) {
    getTrainingTermVectorDocs(trainingSet, function(err, trainingDocs) {
        if (err) { return next(err); }

        var classifierAnalyser = classifier.createClassifierAnalyser();
        classifierAnalyser.addTrainingDocs(trainingDocs);

        return next(null, classifierAnalyser);
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

var getCategorySearchSeedApps = function(seedCategoryId, boostFactor, next) {
    adminRepo.getSeedSearches(seedCategoryId, function(err, seedSearches) {
        if (err) { return next(err); }

        var results = [];

        var processSeedSearch = function(seedSearch, callback) {
            searchSeedApps(seedSearch, boostFactor, false, 0, seedSearch.maxTake, function(err, searchResult) {
                if (err) { return callback(err); }

                searchResult.apps.forEach(function(app) {
                    results.push(app);
                });

                callback();
            });
        };

        async.eachSeries(seedSearches, processSeedSearch, function(err) {
            if (err) { return next(err); }

            next(null, results);
        });
    });
};

var getAppTopKeywords = function(seedCategoryId, appExtId, next) {
    getTermVectors(appExtId, function(err, doc) {
        if (err) { return next(err); }

        classifierRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {
            if (err) { return next(err); }

            getClassifierAnalyser(trainingSet, function(err, classifierAnalyser) {
                if (err) { return next(err); }

                var topTerms = classifierAnalyser.getDocStats(doc, 100);
                return next(null, topTerms);
            });
        });
    });
};

var getTrainingSetTopTerms = function(seedCategoryId, next) {
    log.debug("Retrieving training data");
    classifierRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {
        if (err) { return next(err); }

        getTrainingTermScores(trainingSet, function(err, termScores) {
            if (err) { return next(err); }

            next(null, termScores.desc.splice(0,100));
        });
    });
};

var getCategoryTopKeywords = function(categoryId, next) {
    classifierRepo.getCategoryAppsAsTrainingSet(categoryId, function(err, trainingSet) {
        if (err) { return next(err); }

        getTrainingTermVectorDocs(trainingSet, function(err, trainingDocs) {
            if (err) { return next(err); }

            var classifierAnalyser = classifier.createClassifierAnalyser();
            classifierAnalyser.addTrainingDocs(trainingDocs);

            var topTermsMap = Object.create(null);

            trainingDocs.forEach(function(doc) {
                var termScores = classifierAnalyser.getTermScores(doc);
                termScores.forEach(function(termScore) {
                    var termEntry = topTermsMap[termScore.term];
                    if (!termEntry) {
                        termEntry = {
                            term: termScore.term,
                            score: 0
                        };
                        topTermsMap[termScore.term] = termEntry;
                    }
                    termEntry.score += termScore.tfIdf; // TODO: position factor
                });
            });

            var results = [];
            Object.keys(topTermsMap).forEach(function(key) {
                results.push(topTermsMap[key]);
            });

            results.sort(function(a, b) {
                return b.score - a.score;
            });

            results = results.splice(0, 100);
            return next(null, results);
        });
    });
};

var buildTrainingSetTermVectorQuery = function(ids, position, batchSize) {
    var query = '';
    for (var i = position; i < ids.length && i < position + batchSize; i++) {
        query += 'id:' + ids[i] + ' ';
    }

    return encodeURIComponent(query);
};

var getTrainingTermVectorDocs = function(trainingSet, next) {
    var includeMap = Object.create(null);
    trainingSet.forEach(function(item) {
        var id = item.appExtId.replace(/\-/g, '');
        includeMap[id] = item.include;
    });

    var ids = Object.keys(includeMap);
    var batchSize = 20;

    var docs = [];

    var processBatch = function(position) {
        log.debug("Processing training set term query batch at position: " + position);

        var query = buildTrainingSetTermVectorQuery(ids, position, batchSize);
        searchTermVectors(query, 0, 10000, function(err, searchResult) {
            if (err) { return next(err); }

            searchResult.docs.forEach(function(doc) {
                var include = includeMap[doc.id];

                if (typeof include !== 'boolean') {
                    return next("Could not determine include type for training document: " + doc.id);
                }

                doc.include = include;
                docs.push(doc);
            });

            if (position < ids.length) {
                return processBatch(position + batchSize);
            }

            return next(null, docs, includeMap);
        });
    };

    processBatch(0);
};

var getTrainingTermScores = function(trainingSet, next) {
    getTrainingTermVectorDocs(trainingSet, function(err, trainingDocs) {
        if (err) { return next(err); }

        var trainingAnalyser = classifier.createTrainingAnalyser();
        trainingAnalyser.addTrainingDocs(trainingDocs);
        var termScores = trainingAnalyser.analyseTermScores();

        return next(null, termScores);
    });
};

var iterateSeedSearches = function(seedSearches, visitor, next) {
    var batchSize = 1000;

    var finish = function(err) {
        if (err) { return next(err); }

        return next();
    };

    var processSeedSearch = function(seedSearch, callback) {
        var query = buildSeedTermVectorQuery(seedSearch);

        var processBatch = function(batchIndex) {
            log.debug("Retrieving solr term vectors (batch:" + batchIndex +")");
            searchTermVectors(query, batchSize * batchIndex, batchSize, function(err, searchResult) {
                if (err) { return callback(err); }

                searchResult.docs.forEach(function(doc) {
                    visitor(doc);
                });

                if (searchResult.docs.length < batchSize) {
                    return callback();
                }

                processBatch(batchIndex+1);
            });
        };

        processBatch(0);
    };

    async.eachSeries(seedSearches, processSeedSearch, finish);
};

var iterateCategorySeedSearches = function(seedCategoryId, visitor, next) {
    log.debug("Retrieving seed searches");
    adminRepo.getSeedSearches(seedCategoryId, function(err, seedSearches) {
        if (err) { return next(err); }

        iterateSeedSearches(seedSearches, visitor, function(err) {
            return next(err);
        });
    });
};

var classifyTrainedSeedCategory = function(seedCategoryId, trainingSet, next) {
    getTrainingTermVectorDocs(trainingSet, function(err, trainingDocs, trainingIncludeMap) {
        if (err) { return next(err); }

        var classifierAnalyser = classifier.createClassifierAnalyser();
        classifierAnalyser.addTrainingDocs(trainingDocs);
        var trainingData = classifierAnalyser.buildTrainingMatrix();
        var svm = classifier.createClassifier();

        var results = [];

        // Add all positive training docs to results
        Object.keys(trainingIncludeMap).forEach(function(key) {
            if (trainingIncludeMap[key]) {
                results.push({
                    id: key,
                    result: true
                });
            }
        });

        log.debug("Starting SVM training");
        svm.train(trainingData, function() {
            log.debug("Generating classification results");

            var classifyDoc = function(doc) {
                // Exclude negative training docs
                var trainingInclude = trainingIncludeMap[doc.id];

                if (typeof trainingInclude === 'boolean') {
                    if (!trainingInclude) {
                        results.push({
                            id: doc.id,
                            result: false
                        });
                    }

                    return;
                }

                var termVector = classifierAnalyser.getIndexedTermVector(doc);
                var prediction = svm.predict(termVector);

                results.push({
                    id: doc.id,
                    result: prediction
                });
            };

            iterateCategorySeedSearches(seedCategoryId, classifyDoc, function(err) {
                if (err) { return next(err); }

                return next(null, results);

            });
        });
    });
};

var classifySeedCategory = function(seedCategoryId, saveResults, next) {
    log.debug("Retrieving training data");
    classifierRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {
        if (err) { return next(err); }

        classifyTrainedSeedCategory(seedCategoryId, trainingSet, function(err, results) {
            if (err) { return next(err); }

            if (!saveResults) {
                return next(null, results);
            }

            log.debug("Saving classififcation results to db");
            classifierRepo.setClassificationApps(results, seedCategoryId, function(err) {
                if (err) { return next(err); }

                log.debug("Classification complete");
                return next(null, results);
            });
        });
    });
};

var testSeedCategoryTraining = function(seedCategoryId, next) {
    classifierRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {
        if (err) { return next(err); }

        getTrainingTermVectorDocs(trainingSet, function(err, trainingDocs) {
            if (err) { return next(err); }

            var classifierAnalyser = classifier.createClassifierAnalyser();
            classifierAnalyser.addTrainingDocs(trainingDocs);
            var trainingData = classifierAnalyser.buildTrainingMatrix();
            var svm = classifier.createClassifier();

            log.debug("Starting SVM training");
            svm.train(trainingData, function(err, report) {
                if (err) { return next(err); }

                next(null, report);
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

var getSeedTrainingSet = function(seedCategoryId, next) {
    log.debug("Retrieving training data");
    classifierRepo.getTrainingSet(seedCategoryId, function (err, trainingSet) {
        if (err) {
            return next(err);
        }

        return next(null, trainingSet);
    });
};

var insertSeedTraining = function(seedCategoryId, appExtId, isIncluded, next) {
    classifierRepo.insertSeedTraining(seedCategoryId, appExtId, isIncluded, function(err, id) {
        if (err) { return next(err); }

        return next(null, id);
    });
};

var deleteSeedTraining = function(seedCategoryId, appExtId, next) {
    classifierRepo.deleteSeedTraining(seedCategoryId, appExtId, function(err, id) {
        if (err) { return next(err); }

        return next(null, id);
    });
};

var searchDevAmbiguous = function(name, devId, next) {
    var nameEncoded = encodeURIComponent(solrClusterCore.escapeSolrParserChars(name));

    var solrQuery =
        'q=name:"' + nameEncoded + '"' +
        '&fq=dev_id:"' + devId +'"' +
        '&sort=popularity%20desc&q.op=AND&rows=100' +
        '&fl=id,name,popularity';

    solrClusterCore.client.get('select', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc) {

            var app = {
                id: doc.id,
                name: doc.name,
                popularity: doc.popularity
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

var searchGlobalAmbiguous = function(name, devId, next) {
    var nameEncoded = encodeURIComponent(solrClusterCore.escapeSolrParserChars(name));

    var solrQuery =
        'q=name:"' + nameEncoded + '"' +
        '&sort=popularity%20desc&q.op=AND&rows=1' +
        '&fl=id,popularity';

    if (devId) {
        solrQuery += '&fq=-dev_id:"' + devId +'"';
    }

    solrClusterCore.client.get('select', solrQuery, function (err, obj) {
        if (err) {
            return next(err);
        }

        if (!obj || !obj.response) {
            return next("Unexpected response from search server");
        }

        var apps = obj.response.docs.map(function(doc) {

            var app = {
                id: doc.id,
                popularity: doc.popularity
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

exports.searchDevAmbiguous = searchDevAmbiguous;
exports.searchGlobalAmbiguous = searchGlobalAmbiguous;

exports.getSeedApps = getSeedApps;
exports.getCategorySearchSeedApps = getCategorySearchSeedApps;
exports.getAppTopKeywords = getAppTopKeywords;
exports.classifyTrainedSeedCategory = classifyTrainedSeedCategory;
exports.classifySeedCategory = classifySeedCategory;
exports.getClassificationApps = getClassificationApps;
exports.getSeedTrainingSet = getSeedTrainingSet;
exports.insertSeedTraining = insertSeedTraining;
exports.deleteSeedTraining = deleteSeedTraining;

exports.getTrainingSetTopTerms = getTrainingSetTopTerms;
exports.getCategoryTopKeywords = getCategoryTopKeywords;

exports.testSeedCategoryTraining = testSeedCategoryTraining;




