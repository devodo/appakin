'use strict';

var appConfig = require('./appConfig');
var esClient = require('./esClient');

var indexAlias = appConfig.constants.appIndex.alias;

var parseAppHit = function(appHit) {
    return {
        id: appHit._id,
        field: appHit._source,
        highlight: appHit.highlight,
        score: appHit.sort
    };
};

var addFiltersToParams = function(paramsObject, filterFlags) {
    if (filterFlags.isIphone) {
        paramsObject.is_iphone = true;
    }

    if (filterFlags.isIpad) {
        paramsObject.is_ipad = true;
    }

    if (filterFlags.isFree) {
        paramsObject.is_free = true;
    }
};

var categoryFacetSearchInternal = function(indexName, query, appFrom, appSize, catFrom, catSize, filters, next) {
    var bucketMergeTie = 0.1;

    var includeTopApps = appSize > 0;
    var includeTopCats = catSize > 0;
    var commaSeparator = includeTopApps && includeTopCats;

    var storedTemplate = appConfig.constants.appIndex.template.categoryFacetSearch;
    var params = {
        "from": appFrom,
        "size": appSize,
        "num_cats": catFrom + catSize,
        "top_apps": includeTopApps,
        "top_cats": includeTopCats,
        "exclude_desc": includeTopCats,
        "comma_separator": commaSeparator,
        "query_string": query
    };

    addFiltersToParams(params, filters);

    esClient.searchStoredTemplate(indexName, storedTemplate, params, function(err, resp) {
        if (err) { return next(err); }

        var result = {};

        if (includeTopCats) {
            var categoriesMap = Object.create(null);
            var categories = [];

            resp.aggregations.categories.app_sum.buckets.forEach(function(bucket) {
                var category = {
                    id: bucket.key,
                    score: bucket.app_scores_total.value
                };

                categoriesMap[bucket.key] = category;
                categories.push(category);
            });

            resp.aggregations.name_exact.categories.max_app.buckets.forEach(function(bucket) {
                var category = categoriesMap[bucket.key];
                var bucketValue = bucket.app_score_max.value;

                if (!category) {
                    category = {
                        id: bucket.key,
                        score: bucketValue
                    };

                    categories.push(category);
                } else {
                    category.score = Math.max(category.score, bucketValue) +
                    Math.min(category.score, bucketValue) * bucketMergeTie;
                }
            });

            categories.sort(function(a, b) {
                return b.score - a.score;
            });

            if (catFrom !== 0 || categories.length > catSize) {
                categories = categories.slice(catFrom, catFrom + catSize);
            }

            result.category = {
                total: resp.aggregations.categories.total_categories.value,
                categories: categories
            };
        }

        if (includeTopApps){
            var apps = resp.aggregations.apps.top_app_hits.hits.hits.map(function(appHit) {
                return parseAppHit(appHit);
            });

            result.app = {
                total: resp.aggregations.apps.top_app_hits.hits.total,
                apps: apps
            };
        }

        next(null, result);
    });
};

var categoryExpandSearchInternal = function(indexName, query, categoryIds, appFrom, appSize, filters, next) {
    var storedTemplate = appConfig.constants.appIndex.template.categoryExpandSearch;
    var params = {
        "from": appFrom,
        "size": appSize,
        "cat_ids": categoryIds,
        "query_string": query
    };

    addFiltersToParams(params, filters);

    esClient.searchStoredTemplate(indexName, storedTemplate, params, function(err, resp) {
        if (err) { return next(err); }

        var categories = resp.aggregations.categories.app_categories.buckets.map(function(bucket) {
            var apps = bucket.top_app_hits.hits.hits.map(function(appHit) {
                return parseAppHit(appHit);
            });

            var category = {
                id: bucket.key,
                app: {
                    total: bucket.top_app_hits.hits.total,
                    apps: apps
                }
            };

            return category;
        });

        next(null, categories);
    });
};

var spellSuggest = function(indexName, query, size, next) {
    var body = {
        "text": query,
        "simple_phrase": {
            "phrase": {
                "field": "spell",
                "size": size,
                "real_word_error_likelihood": 0.95,
                "confidence": 1.0,
                "max_errors": 1.0,
                "direct_generator": [
                    {
                        "field": "name",
                        "suggest_mode": "always",
                        "min_word_length": 1
                    }
                ],
                "highlight": {
                    "pre_tag": "<em>",
                    "post_tag": "</em>"
                }
            }
        }
    };

    esClient.suggest(indexName, body, function(err, resp) {
        if (err) { return next(err); }

        if (!resp.simple_phrase || resp.simple_phrase.length < 1) {
            return next(new Error('Unexpected suggest response'));
        }

        next(null, resp.simple_phrase[0].options);
    });
};

var addSpellSuggest = function(indexName, query, facetResult, next) {
    var doSuggest = true;

    if (facetResult.app && facetResult.app.total > 0) {
        doSuggest = false;
    } else if (facetResult.category && facetResult.category.total > 0) {

        if (facetResult.category.total > 10 ||
            facetResult.category.categories[0].score >= 1.0) {
            doSuggest = false;
        }
    }

    if (!doSuggest) {
        return next(null, facetResult);
    }

    spellSuggest(indexName, query, 3, function(err, options) {
        if (err) { return next(err); }

        facetResult.suggestions = options;
        next(null, facetResult);
    });
};


var searchMainInternal = function(indexName, query, appFrom, appSize, catFrom, catSize, catAppFrom, catAppSize, filters, next) {
    categoryFacetSearchInternal(indexName, query, appFrom, appSize, catFrom, catSize, filters, function(err, facetResult) {
        if (err) { return next(err); }

        if (!facetResult.category) {
            return addSpellSuggest(indexName, query, facetResult, next);
        }

        var categoryIds = [];
        var categoryMap = Object.create(null);

        facetResult.category.categories.forEach(function(category) {
            categoryIds.push(category.id);
            categoryMap[category.id] = category;
        });

        categoryExpandSearchInternal(indexName, query, categoryIds, catAppFrom, catAppSize, filters, function(err, expandCategories) {
            if (err) { return next(err); }

            try {
                expandCategories.forEach(function (expandCategory) {
                    var category = categoryMap[expandCategory.id];

                    if (!category) {
                        throw('Missing category from expand list: ' + expandCategory.id);
                    }

                    category.app = expandCategory.app;
                });
            } catch(err) {
                return next(err);
            }

            return addSpellSuggest(indexName, query, facetResult, next);
        });
    });
};

var searchMain = function(query, appFrom, appSize, catFrom, catSize, catAppFrom, catAppSize, filters, next) {
    searchMainInternal(indexAlias, query, appFrom, appSize, catFrom, catSize, catAppFrom, catAppSize, filters, next);
};

var searchCategoryInternal = function(indexName, query, categoryIds, appFrom, appSize, filters, next) {
    categoryExpandSearchInternal(indexName, query, categoryIds, appFrom, appSize, filters, function(err, expandCategories) {
        if (err) { return next(err); }

        next(null, expandCategories);
    });
};

var searchCategory = function(query, categoryIds, appFrom, appSize, filters, next) {
    searchCategoryInternal(indexAlias, query, categoryIds, appFrom, appSize, filters, next);
};

var searchCompleteInternal = function(indexName, query, size, next) {
    var body = {
        "auto": {
            "text": query,
            "completion": {
                "field": "suggest",
                "size": size
            }
        }
    };

    esClient.suggest(indexName, body, function(err, resp) {
        if (err) { return next(err); }

        if (!resp.auto || resp.auto.length < 1) {
            return next(new Error('Unexpected suggest response'));
        }

        next(null, resp.auto[0].options);
    });
};

var searchComplete = function(query, size, next) {
    searchCompleteInternal(indexAlias, query, size, next);
};

exports.searchMain = searchMain;
exports.searchCategory = searchCategory;
exports.searchComplete = searchComplete;

exports.warmupMain = function(index, query, next) {
    searchMainInternal(index, query, 0, 12, 0, 10, 0, 12, {}, next);
};

exports.warmupComplete = function(index, query, next) {
    searchCompleteInternal(index, query, 20, next);
};
