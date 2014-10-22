(function () {
    'use strict';

    angular.module('appAkin').directive('windowWidth', function($window, $timeout) {
        var isNarrowBreakpoint = 740;
        var timeoutHandle;

        return function(scope, element) {
            var w = angular.element($window);
            scope.windowIsNarrow = getWindowWidth() < isNarrowBreakpoint;

            w.bind('resize', function() {
                scope.windowIsNarrow = getWindowWidth() < isNarrowBreakpoint;

                if (timeoutHandle) {
                    $timeout.cancel(timeoutHandle);
                    timeoutHandle = null;
                }

                timeoutHandle = $timeout(function() {scope.$apply();}, 0);
                //scope.$apply();
                // TODO: remove this timeout?
            });

            function getWindowWidth() {
                return $window.innerWidth;
            }
        };
    });
}()); // use strict
