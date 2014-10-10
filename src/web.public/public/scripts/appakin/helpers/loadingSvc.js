(function () {
    'use strict';

    angular.module('appAkin').factory('loading', function($timeout, usSpinnerService) {
        var loadingDelayedThresholdMs = 1000;
        var defaultKey = 'loading';
        var me = this;
        var timeoutPromise = null;

        me.service =  {
            loading: false,
            loadingDelayed: false,
            started: function(key) {
                key = key || defaultKey;

                me.service.reset();

                timeoutPromise = $timeout(
                    function() {
                        me.service.loadingDelayed = true;
                        usSpinnerService.spin(key);
                    },
                    loadingDelayedThresholdMs);
            },
            reset: function(key) {
                key = key || defaultKey;

                me.service.loading = false;
                me.service.loadingDelayed = false;
                usSpinnerService.stop(key);

                if (timeoutPromise) {
                    $timeout.cancel(timeoutPromise);
                    timeoutPromise = null;
                }
            }
        };

        return me.service;
    });

}()); // use strict
