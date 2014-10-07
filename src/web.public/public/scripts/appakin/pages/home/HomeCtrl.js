(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, $animate, $timeout, $document, pageTitle, search) {
        pageTitle.setPageTitle('appAkin');
        search.resetSearchTerm();
        $scope.autocompleteFocused = false;
        var homePageWrapper = angular.element(document.querySelector('#home-page'));

        $scope.$on('autocomplete.focused', function() {
            // probably a problem here with offsetTop not taking scrolling into account,
            // and probably not cross-browser.

            var searchbox = angular.element(document.querySelector('#searchbox-home'));

            $scope.autocompleteFocused = true;

            $timeout(function() {
                $document.scrollTop(searchbox[0].offsetTop - 3);
            }, 0);
        });

        $scope.$on('autocomplete.blurred', function() {
            $document.scrollTop(0, 500);

            $timeout(function() {
                $scope.autocompleteFocused = false;
            }, 500)
        });
    });

}()); // use strict
