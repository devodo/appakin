'use strict';

var env = require('./config-env.json');

var currentEnv = function() {
    var nodeEnv = process.env.NODE_ENV || 'development';
  
    var currentEnv = env[nodeEnv];
    currentEnv.environment = nodeEnv;

    return currentEnv;
};

module.exports = currentEnv();
