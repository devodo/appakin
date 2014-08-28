(function () {
    'use strict';

    angular.module('appAkin').factory('category', function($routeParams, categoryApi, search, platform) {
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
                var urlName = $routeParams.categoryUrlName;

                categoryApi.get(
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
