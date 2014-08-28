(function () {
    'use strict';

    angular.module('appAkin').factory('app', function($routeParams, appApi, search, platform, pageTitle) {
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
                var urlName = $routeParams.appUrlName;

                appApi.get(
                    urlPlatform,
                    urlName,
                    function(data) {
                        me.service.data = data;
                        pageTitle.setPageTitle(data.name + ' app for ' + platform.getFriendlyName(data.platform));
                    }
                );
            }
        };

        return me.service;
    });

}()); // use strict
