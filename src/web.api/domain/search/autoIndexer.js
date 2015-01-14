'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAutoSolrCore();
var log = require('../../logger');

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;
var NGRAM_TYPE = 3;
var APP_ID_OFFSET = 10000000;
var NGRAM_ID_OFFSET = 20000000;

var addCategory = function(core, category, next) {
    var nameDisplay = solrCore.preProcessDisplayText(category.name);
    var nameIndex = solrCore.preProcessIndexText(category.name);

    var solrCategory = {
        id: category.id,
        type: CATEGORY_TYPE,
        "name_display": nameDisplay,
        name: nameIndex,
        "name_word_prefix": nameIndex,
        "popularity": category.popularity
    };

    var nameAscii = solrCore.asciiFold(nameIndex);

    if (nameIndex !== nameAscii) {
        solrCategory.name_alt = nameAscii;
    }

    core.client.add(solrCategory, function(err, obj) {
        if(err){
            return next(err);
        }

        return next(null, solrCategory);
    });
};

var createSolrApp = function(app) {
    var nameDisplay = solrCore.preProcessDisplayText(app.name);
    var nameIndex = solrCore.preProcessIndexText(app.name);

    var solrApp = {
        id: parseInt(app.id, 10) + APP_ID_OFFSET,
        type: APP_TYPE,
        "name_display": nameDisplay,
        name: nameIndex,
        popularity: app.popularity
    };

    var nameAscii = solrCore.asciiFold(nameIndex);

    if (nameIndex !== nameAscii) {
        solrApp.name_alt = nameAscii;
    }

    return solrApp;
};

var createSolrNGram = function(id, text, freq, popularity, useWordGrams) {
    var nameDisplay = solrCore.preProcessDisplayText(text);
    var nameIndex = solrCore.preProcessIndexText(text);

    var solrItem = {
        id: id,
        type: NGRAM_TYPE,
        "name_display": nameDisplay,
        name: nameIndex,
        freq: freq
    };

    if (popularity) {
        solrItem.popularity = popularity;
    }

    if (useWordGrams) {
        solrItem.name_word_prefix = nameIndex;
    }

    return solrItem;
};

var nGramCountToFreq = function(count) {
    return Math.log(count) / Math.log(10);
};

var addAllCategories = function(core, next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var solrCategoryNames = [];

        var processCategory = function(category, callback) {
            log.debug("Adding category: " + category.name);

            addCategory(core, category, function(err, solrCategory) {
                solrCategoryNames.push(solrCategory.name);
                callback(err);
            });
        };

        async.eachSeries(categories, processCategory, function(err) {
            if (err) { return next(err); }

            core.commit(function(err) {
                next(err, solrCategoryNames);
            });
        });
    });
};

var addChartApps = function(core, next) {
    log.debug("Adding chart apps to index");

    appStoreRepo.getChartAppIndex(function(err, apps) {
        if (err) { return next(err); }

        var solrApps = apps.map(function(app) {
            return createSolrApp(app);
        });

        core.client.add(solrApps, function(err){
            if(err){ return next(err); }

            core.commit(function(err) {
                if (err) { return next(err); }

                next();
            });
        });
    });
};

var addAllApps = function(core, lastId, batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;

            log.debug("Last app name: " + apps[apps.length - 1].name);

            var solrApps = apps.map(function(app) {
                return createSolrApp(app);
            });

            core.client.add(solrApps, function(err, obj){
                if(err){
                    return next(err);
                }

                core.commit(function(err) {
                    if (err) {
                        return next(err);
                    }

                    processBatch(lastId);
                });
            });
        });
    };

    processBatch(lastId);
};

var buildNgramTree = function(app, ngramTree, maxDepth) {
    var text = solrCore.preProcessDisplayText(app.name);
    var tokens = text.split(/[:\s]+/);

    var buildNgram = function(depth) {
        if (depth === tokens.length) {
            return text;
        }

        var lastToken = tokens[depth - 1];
        var isStopWord = solrCore.stopwords_en[lastToken];
        if (isStopWord) {
            return null;
        }

        var ngramTokens = [];
        for (var i = 0; i < depth; i++) {
            ngramTokens.push(tokens[i]);
        }
        var ngram = ngramTokens.join(' ');

        return ngram;
    };

    var addNode = function(depth, parent) {
        var ngram = buildNgram(depth);

        if (!ngram) {
            return addNode(depth + 1, parent);
        }

        var ngramItem = parent.children[ngram];
        if (!ngramItem) {
            ngramItem = {
                count: 1,
                childCount: 0,
                children: {}
            };
            parent.children[ngram] = ngramItem;
            var childCount = parent.childCount + 1;
            if (ngramTree.maxCount < childCount) {
                ngramTree.maxCount = childCount;
            }
            parent.childCount = childCount;
        } else {
            ngramItem.count++;
        }

        if (depth === tokens.length) {
            ngramItem.isAppName = true;
            if (tokens.length <= maxDepth &&
                    app.popularity &&
                    (!ngramItem.popularity || ngramItem.popularity < app.popularity)) {
                ngramItem.popularity = app.popularity;
            }
        }
        else if (depth < maxDepth) {
            addNode(depth + 1, ngramItem);
        }
        else {
            addNode(tokens.length, ngramItem);
        }
    };

    addNode(1, ngramTree);
};

var createNGramTree = function(batchSize, nGramSize, next) {
    var nGramTree = {
        maxCount: 0,
        children: {},
        childCount: 0
    };

    var processBatch = function(lastId) {
        log.debug("Calculating ngram count from batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
        //appStoreRepo.getChartAppIndex(function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                return next(null, nGramTree);
            }

            lastId = apps[apps.length - 1].id;

            log.debug("Last app name: " + apps[apps.length - 1].name);

            apps.forEach(function(app) {
                buildNgramTree(app, nGramTree, nGramSize);
            });

            //return next(null, nGramTree);
            processBatch(lastId);
        });
    };

    processBatch(0);
};

var flattenNgramTree = function(ngramTree) {
    var ngramNodes = [];

    var traverseTree = function(parent, ngram) {
        if (parent.childCount > 1 || parent.isAppName) {
            var item = {
                ngram: ngram,
                count: parent.count,
                isAppName: parent.isAppName,
                childCount: parent.childCount
            };

            if (parent.popularity) {
                item.popularity = parent.popularity;
            }

            ngramNodes.push(item);
        }

        Object.keys(parent.children).forEach(function(key) {
            traverseTree(parent.children[key], key);
        });
    };

    Object.keys(ngramTree.children).forEach(function(key) {
        traverseTree(ngramTree.children[key], key);
    });

    return ngramNodes;
};

var indexNGramMap = function(core, batchSize, nGramSize, solrCategoryNames, next) {
    createNGramTree(batchSize, nGramSize, function(err, ngramTree) {
        if (err) { return next(err); }

        var ngramNodes = flattenNgramTree(ngramTree);

        var batch = [];
        var id = NGRAM_ID_OFFSET;
        var maxFreq = nGramCountToFreq(ngramTree.maxCount);

        var existingNamesMap = {};
        solrCategoryNames.forEach(function(name) {
            existingNamesMap[name] = true;
        });

        var processBatch = function() {
            while (ngramNodes.length > 0 && batch.length < batchSize) {
                id = id + 1;
                var item = ngramNodes.pop();

                if (item.isAppName && item.childCount === 0 && !item.popularity) {
                    continue;
                }

                var useWordGrams = item.childCount > 1;
                var freq = item.childCount === 0 ? 0 : nGramCountToFreq(item.childCount) / maxFreq;
                var solrItem = createSolrNGram(id, item.ngram, freq, item.popularity, useWordGrams);
                if (!existingNamesMap[solrItem.name]) {
                    batch.push(solrItem);
                }
            }

            if (batch.length === 0) {
                return next();
            }

            log.debug("Adding batch starting at: " + batch[0].id);

            core.client.add(batch, function(err){
                if(err){
                    return next(err);
                }

                core.commit(function(err) {
                    if (err) {
                        return next(err);
                    }

                    batch = [];
                    processBatch();
                });
            });
        };

        processBatch();
    });
};

var rebuild = function(batchSize, nGramSize, next) {
    log.debug("Creating temp core");
    solrCore.createTempCore(function(err, tempCore) {
        if (err) { return next(err); }

        addAllCategories(tempCore, function(err, solrCategoryNames) {
            if (err) { return next(err); }

            //indexNGramMap(tempCore, batchSize, nGramSize, solrCategoryNames, function(err) {
            //    if (err) { return next(err); }

                tempCore.optimise(function(err) {
                    return next(err);
                });

                log.debug("Swapping in temp core");
                solrCore.swapOrRenameCore(tempCore, function(err) {
                    if (err) { return next(err); }

                    next();
                });
            //});
        });
    });
};

var getCoreStatus = function(next) {
    solrCore.getCoreStatus(next);
};

exports.rebuild = rebuild;
exports.createNGramTree = createNGramTree;
exports.buildNgramTree = buildNgramTree;
exports.flattenNgramTree = flattenNgramTree;
exports.getCoreStatus = getCoreStatus;





