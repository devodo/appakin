(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, $timeout, $document, pageTitle, search) {
        pageTitle.setPageTitle('appAkin');
        search.resetSearchTerm();

        $scope.autocompleteFocused = false;

        var focusTimer = null;
        var blurTimer = null;
        var searchbox = angular.element(document.querySelector('#searchbox-home'));

        var deregisterAutocompleteFocused = $scope.$on(
            'autocomplete.focused',
            function() {
                // probably a problem here with offsetTop not taking scrolling into account,
                // and probably not cross-browser.

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
                var actionTimeMs = 500;

                $document.scrollTop(0, actionTimeMs);

                if (blurTimer) {
                    $timeout.cancel(blurTimer);
                }

                blurTimer = $timeout(function() {
                    $scope.autocompleteFocused = false;
                }, actionTimeMs)
            });

        $scope.$on('$destroy', function() {
            deregisterAutocompleteBlurred();
            deregisterAutocompleteFocused();
            if (focusTimer) { $timeout.cancel(focusTimer); }
            if (blurTimer) { $timeout.cancel(blurTimer); }
            searchbox = null;
        });
    });

}()); // use strict
