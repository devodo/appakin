(function () {'use strict';

    var appAkin = angular.module('appAkin', [
        'ngRoute'
    ]);

    module.exports = appAkin;

    appAkin.config(['$routeProvider', '$locationProvider',
        function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'home.html',
                controller: 'HomeCtrl'
            })
            .when('/raters', {
                templateUrl: 'raters.html',
                controller: 'RatersCtrl'
            })
            .when('/about', {
                templateUrl: 'about.html',
                controller: 'AboutCtrl'
            })
            .when('/terms', {
                templateUrl: 'terms.html',
                controller: 'TermsCtrl'
            })
            .when('/search', {
                templateUrl: 'search.html',
                controller: 'SearchCtrl'
            })
            .when('/category', {
                templateUrl: 'category.html',
                controller: 'CategoryCtrl'
            })
            .when('/app', {
                templateUrl: 'app.html',
                controller: 'AppCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    }]);

}()); // use strict
