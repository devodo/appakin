(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, $timeout, $document, pageTitle, search) {
        pageTitle.setPageTitle('appAkin');
        search.resetSearchTerm();

        $scope.autocompleteFocused = false;

        var focusTimer;
        var blurTimer;

        var deregisterAutocompleteFocused = $scope.$on(
            'autocomplete.focused',
            function() {
                // probably a problem here with offsetTop not taking scrolling into account,
                // and probably not cross-browser.

                var searchbox = angular.element(document.querySelector('#searchbox-home'));

                $scope.autocompleteFocused = true;

                if (focusTimer) {
                    $timeout.cancel(focusTimer);
                }

                focusTimer = $timeout(function() {
                    $document.scrollTop(searchbox[0].offsetTop - 3);
                }, 0);
            });

        var deregisterAutocompleteBlurred = $scope.$on(
            'autocomplete.blurred',
            function() {
                $document.scrollTop(0, 500);

                if (blurTimer) {
                    $timeout.cancel(blurTimer);
                }

                blurTimer = $timeout(function() {
                    $scope.autocompleteFocused = false;
                }, 500)
            });

        $scope.$on('$destroy', function() {
            deregisterAutocompleteBlurred();
            deregisterAutocompleteFocused();
            $timeout.cancel(focusTimer);
            $timeout.cancel(blurTimer);
        });
    });

}()); // use strict
