(function () {'use strict';

    var appAkin = angular.module('appAkin', [
        'ngRoute',
        'ngCookies',
        'ngTouch',
        'ngDropdowns',
        'ui.bootstrap.pagination',
        'allmighty.autocomplete',
        'appAkin.config'
    ]);

    appAkin.config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'appakin/pages/home/home.html',
                controller: 'HomeCtrl'
            })
            .when('/raters', {
                templateUrl: 'appakin/pages/raters/raters.html',
                controller: 'RatersCtrl'
            })
            .when('/about', {
                templateUrl: 'appakin/pages/about/about.html',
                controller: 'AboutCtrl'
            })
            .when('/terms', {
                templateUrl: 'appakin/pages/terms/terms.html',
                controller: 'TermsCtrl'
            })
            .when('/search', {
                templateUrl: 'appakin/pages/search-results/search-results.html',
                controller: 'SearchResultsCtrl',
                reloadOnSearch: false
            })
            .when('/:platform/category/:categoryUrlName', {
                templateUrl: 'appakin/pages/category/category.html',
                controller: 'CategoryCtrl'
            })
            .when('/:platform/app/:appUrlName', {
                templateUrl: 'appakin/pages/app/app.html',
                controller: 'AppCtrl'
            })
            .when('/privacy', {
                templateUrl: 'appakin/pages/privacy/privacy.html',
                controller: 'PrivacyCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    });

}()); // use strict
