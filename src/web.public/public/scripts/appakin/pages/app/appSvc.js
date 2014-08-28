(function () {
    'use strict';

    angular.module('appAkin').factory('app', function($routeParams, appApi, search, platform) {
        var me = this;

        me.service = {
            data: {},
            updateSearch: function() {
                var urlPlatform = platform.normalisePlatform($routeParams.platform);

                if (urlPlatform && search.platform != urlPlatform) {
                    search.platform = urlPlatform;
                }
            },
            get: function() {
                var platform = $routeParams.platform;
                var urlName = $routeParams.appUrlName;

                appApi.get(
                    platform, urlName,
                    function(data) {
                        me.service.data = data;
                    }
                );
            }
        };

        return me.service;
    });

}()); // use strict
