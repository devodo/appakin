(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, $timeout, $document, pageTitle, search) {
        pageTitle.setPageTitle('AppAkin - Search for iPhone and iPad apps');
        search.resetSearchTerm();

        $scope.autocompleteFocused = false;

        var focusTimer = null;
        var blurTimer = null;

        var deregisterAutocompleteFocused = $scope.$on(
            'autocomplete.focused',
            function() {
                if (!$scope.windowIsNarrow) {
                    return;
                }

                var searchbox = angular.element(document.querySelector('#searchbox-home'));

                $scope.autocompleteFocused = true;

                if (focusTimer) {
                    $timeout.cancel(focusTimer);
                }

                focusTimer = $timeout(function() {
                    var offset = offsetTop(searchbox) - 3;
                    $document.scrollTop(offset);
                    document.body.scrollTop = offset;
                }, 1);
            });

        var deregisterAutocompleteBlurred = $scope.$on(
            'autocomplete.blurred',
            function() {
                if (!$scope.windowIsNarrow) {
                    return;
                }

                $document.scrollTop(0, 500);

                if (blurTimer) {
                    $timeout.cancel(blurTimer);
                }

                blurTimer = $timeout(function() {
                    $scope.autocompleteFocused = false;
                }, 500);
            });

        $scope.$on('$destroy', function() {
            deregisterAutocompleteBlurred();
            deregisterAutocompleteFocused();
            $timeout.cancel(focusTimer);
            $timeout.cancel(blurTimer);
        });

        function offsetTop(elm) {
            var rawDom = elm[0];
            var _y = 0;
            var body = document.documentElement || document.body;
            var scrollY = window.pageYOffset || body.scrollTop;
            _y = rawDom.getBoundingClientRect().top + scrollY;
            return _y;
        }
    });

}()); // use strict
