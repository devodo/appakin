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

var categoryFacetSearch = function(query, appFrom, appSize, catFrom, catSize, next) {
    var bucketMergeTie = 0.1;

    var includeTopApps = appSize > 0;

    var storedTemplate = appConfig.constants.appIndex.template.categoryFacetSearch;
    var params = {
        "from": appFrom,
        "size": appSize,
        "num_cats": catFrom + catSize,
        "top_apps": includeTopApps,
        "query_string": query
    };

    esClient.searchStoredTemplate(indexAlias, storedTemplate, params, function(err, resp) {
        if (err) { return next(err); }

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

        var result = {
            category: {
                total: resp.aggregations.categories.total_categories.value,
                categories: categories
            }
        };

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

var categoryExpandSearch = function(query, categoryIds, appFrom, appSize, next) {
    var storedTemplate = appConfig.constants.appIndex.template.categoryExpandSearch;
    var params = {
        "from": appFrom,
        "size": appSize,
        "cat_ids": categoryIds,
        "query_string": query
    };

    esClient.searchStoredTemplate(indexAlias, storedTemplate, params, function(err, resp) {
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


var searchMain = function(query, appFrom, appSize, catFrom, catSize, next) {
    categoryFacetSearch(query, appFrom, appSize, catFrom, catSize, function(err, facetResult) {
        if (err) { return next(err); }

        if (facetResult.category.categories.length > 0) {
            var categoryIds = [];
            var categoryMap = Object.create(null);

            facetResult.category.categories.forEach(function(category) {
                categoryIds.push(category.id);
                categoryMap[category.id] = category;
            });

            categoryExpandSearch(query, categoryIds, 0, 12, function(err, expandCategories) {
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

                next(null, facetResult);

            });
        }
    });
};

exports.searchMain = searchMain;
