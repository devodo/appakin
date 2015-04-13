'use strict';

var fs = require('fs');
var extend = require('node.extend');
var env = require('./config-env.json');

var currentEnv = function() {
    var nodeEnv = process.env.NODE_ENV || 'development';
  
    var currentEnv = env.common;
    extend(true, currentEnv, env[nodeEnv]);
    currentEnv.environment = nodeEnv;

    var localConfigPath = 'config-local.json';
    if (fs.existsSync(localConfigPath)) {
        var localConfig = fs.readFileSync(localConfigPath, 'utf8');
        var local = JSON.parse(localConfig);
        extend(true, currentEnv, local);
    }

    return currentEnv;
};

module.exports = currentEnv();
