'use strict';
var solrClusterCore = require('./solrCore').getClusterCore();
var solrCategoryCore = require('./solrCore').getCategoryCore();

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
        var stats = fieldArray[indexBase + 1];
        var docFreq = stats[7];

        if (docFreq < minDocFreq) {
            continue;
        }

        var term = fieldArray[indexBase];

        if (term.length < minTermLength) {
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
    var solrQuery = 'q=' + appId;

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

function log(b, n) {
    return Math.log(n) / Math.log(b);
}

var getKeywords = function(appId, next) {
    var minDocFreq = 10;
    var minTermLength = 2;

    getTermStats(appId, minDocFreq, minTermLength, function(err, termStats) {
        if (err) { return next(err); }

        var keywordMap = {};

        termStats.name.forEach(function(term) {
            var tfIdfExp = Math.pow(10, term.tfIdf);
            var score = log(10, (1.0 * tfIdfExp) / term.termFreq);

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

            var tfIdfExp = Math.pow(10, term.tfIdf);
            var score = log(10, tfIdfExp * Math.pow(term.termFreq, 0.2));

            keyword.score += score;
        });

        var keywords = Object.keys(keywordMap).map(function(key) {
            return keywordMap[key];
        });

        keywords.sort(function(a, b) {
            return b.score - a.score;
        });

        next(null, keywords);
    });
};

var buildSearchQuery = function(keywords, maxTerms) {
    var queryTerms = [];
    for (var i = 0; i < keywords.length && i < maxTerms; i++) {
        var boost = keywords[i].score / keywords[0].score;
        queryTerms.push(solrClusterCore.escapeSpecialCharsAllowQuotes(keywords[i].keyword) + '^' + boost);
    }

    return encodeURIComponent(queryTerms.join(' '));
};

var searchKeywords = function(appId, keywords, next) {
    var q = buildSearchQuery(keywords, 25);
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

exports.searchSimilarByName = searchSimilarByName;
exports.getKeywords = getKeywords;
exports.search = search;





