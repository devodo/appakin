'use strict';
var Crawler = require("crawler").Crawler;
var async = require('async');
var log = require('../logger');
var appakinRepo = require("../repos/appakinRepo.js");

var crawl = function(seedUrls, next) {
    var nameRegex = /.*-([^\/]+)\/(.*)-.*\//;
    var crawlCount = 0;

    var urlHistory = {};

    var c = new Crawler({
        "maxConnections":2,
        "skipDuplicates":true,

        //This will be called for each crawled page
        "callback": function(error,result,$) {
            $('section.interest-box').not('.wide').find('a.header').each(function(index,a) {
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

                appakinRepo.insertXyoCategory(category, function(err, id) {
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
                log.debug("App page: " + a.href);

                urlHistory[a.href] = true;
                c.queue(a.href);
            });
        },
        "onDrain": function() {
            next(null, crawlCount);
        }
    });

    c.queue(seedUrls);
};

exports.crawl = crawl;


