(function () {'use strict';

    var appAkin = angular.module('appAkin', [
        'ngRoute',
        'ngCookies',
        'ngSanitize',
        'ngTouch',
        'ngDropdowns',
        'ui.bootstrap.pagination',
        'allmighty.autocomplete',
        'appAkin.config',
        'appAkin.http',
        'debounce',
        'angularSpinner',
        'angular-carousel',
        'ngStorage',
        'duScroll'
    ]);

    appAkin.config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: '/public/templates/appakin/pages/home/home.html',
                controller: 'HomeCtrl'
            })
            .when('/raters', {
                templateUrl: '/public/templates/appakin/pages/raters/raters.html',
                controller: 'RatersCtrl'
            })
            .when('/about', {
                templateUrl: '/public/templates/appakin/pages/about/about.html',
                controller: 'AboutCtrl'
            })
            .when('/terms', {
                templateUrl: '/public/templates/appakin/pages/terms/terms.html',
                controller: 'TermsCtrl'
            })
            .when('/search', {
                templateUrl: '/public/templates/appakin/pages/search-results/search-results.html',
                controller: 'SearchResultsCtrl',
                //reloadOnSearch: false
                resolve: {
                    searchData: ['$route', 'search', 'searchApi', function($route, search, searchApi) {
                        search.updateSearchFromUrl();

                        return searchApi.get(
                            $route.current.params.p,
                            $route.current.params.q,
                            $route.current.params.type,
                            $route.current.params.page
                        );
                    }]
                }
            })
            .when('/:platform/category/:encodedId/:slug', {
                templateUrl: '/public/templates/appakin/pages/category/category.html',
                controller: 'CategoryCtrl',
                resolve: {
                    categoryData: ['$route', 'categoryApi', function($route, categoryApi) {
                        return categoryApi.get(
                            $route.current.params.platform,
                            $route.current.params.encodedId,
                            $route.current.params.slug
                        );
                    }]
                }
            })
            .when('/:platform/app/:encodedId/:slug', {
                templateUrl: '/public/templates/appakin/pages/app/app.html',
                controller: 'AppCtrl',
                resolve: {
                    appData: ['$route', 'appApi', function($route, appApi) {
                        return appApi.get(
                            $route.current.params.platform,
                            $route.current.params.encodedId,
                            $route.current.params.slug
                        );
                    }]
                }
            })
            .when('/privacy', {
                templateUrl: '/public/templates/appakin/pages/privacy/privacy.html',
                controller: 'PrivacyCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    });

}()); // use strict
