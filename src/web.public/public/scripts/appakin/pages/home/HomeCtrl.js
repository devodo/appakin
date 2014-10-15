(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, $timeout, $document, pageTitle, search) {
        pageTitle.setPageTitle('appAkin - Search for iPhone and iPad apps');
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
                    $document.scrollTop(offsetTop(searchbox) - 20);
                            //searchbox[0].offsetTop - 3);
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
