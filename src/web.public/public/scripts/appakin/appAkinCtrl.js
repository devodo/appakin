(function () {
    'use strict';

    angular.module('appAkin').controller(
        'AppAkin',
        function($scope, $location, pageTitle, $rootScope, loading, $document, $timeout, url, search, cache) {
            $scope.pageTitle = pageTitle;

            // Perform actions that crosscut the controllers.
            $rootScope.$on('$viewContentLoaded', function() {
                //console.log('view content loaded');
                $timeout(
                    function() {
                        var urlKey = $location.url();
                        var onSearchResultsPage = url.onSearchResultsPage(urlKey);
                        var onCategoryPage = url.onCategoryPage(urlKey);

                        // set scroll position.
                        if (onSearchResultsPage || onCategoryPage) {
                            // get the scroll position from the cache.

                            var key = createScrollCacheKey(urlKey);
                            var scrollValue = cache.get(key);

                            if (scrollValue > 0) {
                                //console.log('Got scroll key: ' + key + ' - scrolling to ' + scrollValue);
                                $document.scrollTop(scrollValue);
                            } else {
                                $document.scrollTop(0);
                            }
                        } else {
                            // scroll to the top of the page
                            $document.scrollTop(0);
                        }

                        // reset the search term on all pages except the search results page.
                        if (!onSearchResultsPage) {
                            search.resetSearchTerm();
                        }

                        // Ensure the global spinner disappears if it is visible.
                        loading.reset();
                    },
                    0);
            });

            $rootScope.$on('$locationChangeStart', function(event, nextLocation, currentLocation) {
                var urlKey = url.removeHost(currentLocation);
                //console.log('locationchangestart urlKey: ' + urlKey);

                if (url.onSearchResultsPage(urlKey) || url.onCategoryPage(urlKey)) {
                    var key = createScrollCacheKey(urlKey);
                    var value = $document.scrollTop();
                    console.log('Setting scroll key: ' + key + ' value: ' + value);
                    cache.set(key, value, false);
                }
            });

            function createScrollCacheKey(urlKey) {
                return 'scroll ' + urlKey;
            }
        });

}()); // use strict
