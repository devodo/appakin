(function () {
    'use strict';

    var appAkin = require('../appakin/appakin.js');

    // Manages persistence in the app.
    appAkin.factory('persistenceService', ['$cookies', '$location',
        function($cookies, $location) {

            var userAcceptsCookies = $cookies.userAcceptsCookies;

            return {
                userAcceptsCookies: function() {

                }
            };
        }]);

}()); // use strict
