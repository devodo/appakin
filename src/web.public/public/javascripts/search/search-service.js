(function () {
    'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.factory('searchService', ['$cookies', '$routeParams', '$route', '$location', '$http', 'configuration',
        function($cookies, $routeParams, $route, $location, $http, configuration) {

            var platform = getInitialPlatform();

            function normalisePlatform(value) {
                if (!(/(ios|android|winphone)/).test(value)) {
                    return undefined;
                }

                return value;
            }

            function getInitialPlatform() {
                var defaultPlatform = 'ios';

                // TODO: remove this return statement when App Akin supports multiple platforms.
                //return defaultPlatform;

                var platform = normalisePlatform($routeParams.platform);

                if (platform === undefined) {
                    platform = normalisePlatform($cookies.platform);
                }

                if (platform === undefined) {
                    var clientStrings = [
                        {s: 'winphone', r: /Windows Phone/},
                        {s: 'android', r: /Android/},
                        {s: 'ios', r: /(iPhone|iPad|iPod|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/}
                    ];

                    for (var id in clientStrings) {
                        var cs = clientStrings[id];
                        if (cs.r.test(navigator.userAgent)) {
                            platform = cs.s;
                            break;
                        }
                    }
                }

                if (platform === undefined) {
                    platform = defaultPlatform;
                }

                $cookies.platform = platform;

                return platform;
            }

            return {
                searchTerm: '',
                getPlatform: function() { return platform; },
                setPlatform: function(value) {
                    if (value !== platform)
                    {
                        var normalisedValue = normalisePlatform(value);
                        if (normalisedValue !== undefined)
                        {
                            platform = normalisedValue;
                            $cookies.platform = platform;
                        }
                    }
                },
                redirectToSearch : function() {
                    // TODO: trimming of search term
                    if (this.searchTerm === '') {
                        return;
                    }

                    $location.path('/search').search({
                        q: this.searchTerm,
                        platform: platform
                    });

                    $location.replace();
                },
                search : function(page, callback, errorCallback) {

                    var search = $location.search();

                    $location.search(
                        {
                            q: search.q,
                            platform: search.platform,
                            page: page,
                            take: (search.take || 10)
                        }
                    );

                    search = $location.search();

                    console.log($location);
                    console.log($route.current.params.page + ' ' + page + ' ' + search.page);

                    var url = configuration.apiBaseUrl + 'search?q=' + (search.q || '') +
                        '&platform=' + (search.platform || '') +
                        '&page=' + search.page +
                        '&take=' + (search.take || 10);

                    console.log('request: ' + url);

                    $http({method: 'GET', url: url}).
                        success(function(data, status, headers, config) {
                            // this callback will be called asynchronously
                            // when the response is available
                            callback(data);
                        }).
                        error(function(data, status, headers, config) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            errorCallback();
                        });
                }
            };
        }]);

}()); // use strict
