(function () {
    'use strict';

    angular.module('appAkin').factory('app', function($routeParams, search, platform) {
        var me = this;

        me.service = {
            data: {},
            updateSearch: function() {
                var urlPlatform = platform.normalisePlatform($routeParams.platform);

                if (urlPlatform && search.platform != urlPlatform) {
                    search.platform = urlPlatform;
                }
            }
        };

        return me.service;
    });

}()); // use strict
