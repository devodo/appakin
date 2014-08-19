'use strict';

var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res) {
  var indexPath = path.resolve(__dirname + '/../index.html');
  res.sendfile(indexPath);
});

module.exports = router;
