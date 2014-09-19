(function () {
    'use strict';

    angular.module('appAkin').factory('app', function($routeParams, httpGet, search, spinner, platform, pageTitle) {
        var me = this;

        var appApi = httpGet();
        var spinnerInstance = spinner('app-info');

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
                var urlEncodedId = $routeParams.encodedId;
                var urlSlug = $routeParams.slug;

                spinnerInstance();

                appApi(
                    urlPlatform + '/app/' + urlEncodedId + '/' + urlSlug,
                    function(data) {
                        data.platform = urlPlatform;
                        data.serverError = false;
                        me.service.data = data;

                        pageTitle.setPageTitle(data.name + ' app for ' + platform.getFriendlyName(urlPlatform));
                        spinnerInstance.stop();
                    },
                    function(data) {
                        me.service.data.serverError = true;

                        spinnerInstance.stop();
                    });
            }
        };

        return me.service;
    });

}()); // use strict
