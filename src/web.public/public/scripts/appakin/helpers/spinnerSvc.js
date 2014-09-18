(function () {
    'use strict';

    angular.module('appAkin').factory('spinner', function($timeout, usSpinnerService) {
        var defaultDelayMs = 600;

        return function(key, delayMs) {
            delayMs = delayMs || defaultDelayMs;

            var currentSpinner;

            function resetCurrentSpinner() {
                if (currentSpinner) {
                    if (currentSpinner.delayTimeout) {
                        $timeout.cancel(currentSpinner.delayTimeout);
                        currentSpinner.delayTimeout = null;
                    }

                    usSpinnerService.stop(key);
                }

                currentSpinner = {};
            }

            function spin() {
                resetCurrentSpinner();

                var localCurrentSpinner = currentSpinner;

                localCurrentSpinner.delayTimeout = $timeout(function() {
                    usSpinnerService.spin(key);
                }, delayMs);
            }

            spin.stop = resetCurrentSpinner;
            return spin;
        };
    });

}()); // use strict
