'use strict';
var Crawler = require("crawler").Crawler;
var async = require('async');
var url = require('url');
var cheerio = require('cheerio');
var log = require('../../logger');
var xyoRepo = require("../../repos/xyoRepo.js");
var request = require('request');

var crawlCategoryApps = function(category, numPages, next) {
    var items = [];

    var retrievePage = function(pageNumber) {
        var parsePageSrc = function(pageSrc) {
            var $ = cheerio.load(pageSrc);

            var itemList = $('div.search-results-list div.titleCont h2');

            $(itemList).each(function(index, h2) {
                items.push({
                    name: $(h2).text()
                });
            });

            if (pageNumber === numPages || itemList.length === 0) {
                return next(null, items);
            }

            retrievePage(pageNumber + 1);
        };

        var url = category.url + '?page=' + pageNumber;
        request(url, function (err, response, src) {
            if (err) {
                return next(err);
            }

            parsePageSrc(src);
        });
    };

    retrievePage(1);
};

var getCategories = function(next) {
    xyoRepo.getXyoCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        next(null, categories);
    });
};

var retrieveCategoryApps = function(category, batchId, numPages, next) {
    log.debug("Retrieve category apps for category: " + category.id);

    crawlCategoryApps(category, numPages, function(err, apps) {
        if (err) {
            return next(err);
        }

        var duplicateCheck = {};

        var position = 0;

        var insertApp = function(app, callback) {
            position = position + 1;
            if (duplicateCheck[app.name]) {
                log.warn("Duplicate app detected: " + app.name);
                return callback();
            }
            duplicateCheck[app.name] = true;

            xyoRepo.insertXyoCategoryApp(category.id, batchId, app.name, position, function(err) {
                if (err) {
                    return callback(err);
                }

                callback();
            });
        };

        async.eachSeries(apps, insertApp, next);
    });
};

var retrieveAllCategoryApps = function(batchId, numPages, next) {
    getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function(category, callback) {
            retrieveCategoryApps(category, batchId, numPages, function(err) {
                if (err) {
                    return callback(err);
                }

                callback();
            });
        };

        async.eachSeries(categories, processCategory, next);

    });
};

var crawlCategories = function(seedUrls, next) {
    var nameRegex = /.*-([^\/]+)\/(.*)-.*\//;
    var crawlCount = 0;

    var urlHistory = {};

    var c = new Crawler({
        "maxConnections":5,

        //This will be called for each crawled page
        "callback": function(error,result,$) {
            log.debug(result.uri);

            $('section.interest-box').not('.wide').find('a.header').each(function(index,a) {
                if (urlHistory[a.href]) {
                    return;
                }
                //log.debug("Category page: " + a.href);

                urlHistory[a.href] = true;

                var url = a.href;

                log.debug("Found: " + url);

                var div = $(a).children('div').first();
                var linkText = $(div).children('h3').text();
                var description = $(div).children('p').text();

                var match = nameRegex.exec(url);
                var appType = match[1];
                var nameWords = match[2].split("-");
                var name = nameWords.join(" ");
                if (nameWords[nameWords.length - 1] !== appType) {
                    name = name + " " + appType;
                }

                var category = {
                    name: name,
                    linkText: linkText,
                    description: description,
                    url: url
                };

                xyoRepo.insertXyoCategory(category, function(err, id) {
                    if (err) {
                        return next(err);
                    }

                    if (id !== -1) {
                        log.debug("Inserted xyo category: " + id);
                        crawlCount++;
                        c.queue(url);
                    }
                });
            });

            $('div.search-results-list a').each(function(index,a) {
                if (urlHistory[a.href]) {
                    return;
                }
                //log.debug("App page: " + a.href);

                urlHistory[a.href] = true;

                for (var i = 1; i <= 10; i++) {
                    c.queue(a.href + '?page=' + i);
                }
            });
        },
        "onDrain": function() {
            next(null, crawlCount);
        }
    });

    xyoRepo.getXyoCategories(function(err, categories) {
        if (err) { return next(err); }

        categories.forEach(function(category) {
            urlHistory[category.url] = true;
        });

        c.queue(seedUrls);
    });
};

exports.crawlCategories = crawlCategories;
exports.crawlCategoryApps = crawlCategoryApps;
exports.retrieveAllCategoryApps = retrieveAllCategoryApps;


