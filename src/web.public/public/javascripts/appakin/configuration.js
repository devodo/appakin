(function () {
    'use strict';

    var appAkin = require('./appakin.js');

    appAkin.factory('configuration', [
        function() {
            return {
                apiBaseUrl: 'http://127.0.0.1:3002/api/'
            };
        }]);

}()); // use strict
