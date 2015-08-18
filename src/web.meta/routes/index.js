'use strict';

var config = require('../config');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      title: 'App Akin',
      description: 'Better iPhone and iPad app search and discovery with categories, popularity, price drops, videos and more!',
      image: 'http://www.appakin.com/images/appakin-logo-pinterest.png',
      url: req.protocol + '//' + config.domain + req.originalUrl
  });
});

router.get('/ios/category/browse', function(req, res, next) {
    res.render('index', {
        title: 'App Akin - Categories',
        description: 'Browse popular categories for iPhone and iPad apps',
        url: req.protocol + '//' + config.domain + req.originalUrl
    });
});

router.get('/ios/pricedrops', function(req, res, next) {
    res.render('index', {
        title: 'App Akin - Price Drops',
        description: 'Browse popular price drops for iPhone and iPad apps',
        url: req.protocol + '//' + config.domain + req.originalUrl
    });
});


module.exports = router;
