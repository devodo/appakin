(function () {
    'use strict';

    angular.module('appAkin').factory('category', function($routeParams, categoryApi, search, platform, pageTitle) {
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
                var urlPlatform = $routeParams.platform;
                var urlName = $routeParams.categoryUrlName;

                categoryApi.get(
                    urlPlatform, urlName,
                    function(data) {
                        me.service.data = data;
                        pageTitle.setPageTitle(data.name + ' for ' + platform.getFriendlyName(data.platform));
                    }
                );
            }
        };

        return me.service;
    });

}()); // use strict
