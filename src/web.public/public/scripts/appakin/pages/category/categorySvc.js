(function () {
    'use strict';

    angular.module('appAkin').factory('category',
        function($routeParams, $route, search, platform, categoryApi) {
            var me = this;
            var getNextPagePromise = null;

            me.service = {
                data: {},
                hasMorePages: true,
                reset: function(data) {
                    me.service.data = data;
                    me.service.hasMorePages = true;
                },
                cancel: function() {
                    if (getNextPagePromise) {
                        //getNextPagePromise.reject('cancelled');
                        getNextPagePromise = null;
                    }
                },
                updateSearch: function() {
                    var urlPlatform = platform.normalisePlatform($routeParams.platform);

                    if (urlPlatform && search.platform != urlPlatform) {
                        search.platform = urlPlatform;
                    }
                },
                appendNextPage: function() {
                    var i;

                    me.service.cancel();

                    getNextPagePromise = categoryApi.getMore(
                        $route.current.params.platform,
                        $route.current.params.encodedId,
                        $route.current.params.slug,
                        me.service.data.page + 1
                    );

                    getNextPagePromise.then(function(data) {
                        if (data) {
                            if (data.apps && data.apps.length > 0) {

                                for (i = 0; i < data.apps.length; ++i) {
                                    me.service.data.apps.push(data.apps[i]);
                                }

                                me.service.data.page = data.page;
                            } else {
                                me.service.hasMorePages = false;
                            }
                        }
                    });
                }
            };

            return me.service;
        });

}()); // use strict
