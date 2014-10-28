(function () {
    'use strict';

    angular.module('appAkin').factory('app', function($routeParams, $location, url, search, platform) {
        var me = this;

        me.service = {
            fromCategoryExtId: null,
            updateSearch: function() {
                var urlPlatform = platform.normalisePlatform($routeParams.platform);

                if (urlPlatform && search.platform != urlPlatform) {
                    search.platform = urlPlatform;
                }
            },
            loadAppPage: function(platform, urlName, fromCategoryExtId) {
                me.service.fromCategoryExtId = fromCategoryExtId;
                var appUrl = url.createAppUrl(platform, urlName);
                $location.path(appUrl).search({});
            }
        };

        return me.service;
    });

}()); // use strict
