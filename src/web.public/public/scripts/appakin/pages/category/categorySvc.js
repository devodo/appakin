(function () {
    'use strict';

    angular.module('appAkin').factory('category',
        function($routeParams, $route, search, platform, categoryApi) {
            var me = this;
            var getNextPagePromise = null;

            me.service = {
                cancel: function() {
                    if (getNextPagePromise) {
                        getNextPagePromise = null;
                    }
                },
                excludeFromCategory: function(categoryExtId, appExtId) {
                    console.log('excluding ' + appExtId + ' from ' + categoryExtId);
                    categoryApi.excludeFromCategory(categoryExtId, appExtId);
                },
                updateSearch: function() {
                    var urlPlatform = platform.normalisePlatform($routeParams.platform);

                    if (urlPlatform && search.platform != urlPlatform) {
                        search.platform = urlPlatform;
                    }
                },
                appendNextPage: function(currentData) {
                    var i;

                    me.service.cancel();

                    getNextPagePromise = categoryApi.getMore(
                        $route.current.params.platform,
                        $route.current.params.encodedId,
                        $route.current.params.slug,
                        currentData.page + 1
                    );

                    getNextPagePromise.then(function(data) {
                        if (data) {
                            if (data.apps && data.apps.length > 0) {

                                for (i = 0; i < data.apps.length; ++i) {
                                    currentData.apps.push(data.apps[i]);
                                }

                                currentData.page = data.page;
                            } else {
                                currentData.hasMorePages = false;
                            }
                        }
                    });
                }
            };

            return me.service;
        });

}()); // use strict
