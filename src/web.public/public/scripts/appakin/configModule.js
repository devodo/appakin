(function () {
    'use strict';

    angular.module('appAkin.config', [])
        //.constant('webApiUrl', 'http://10.0.1.6:3002/')
        //.constant('webApiUrl', 'http://10.0.1.4:3002/')
        .constant('webApiUrl', 'http://192.168.0.17:3002/')
        .constant('cacheApiRequests', false);

}()); // use strict
