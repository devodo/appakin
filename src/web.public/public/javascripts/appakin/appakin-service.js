(function () {'use strict';

    var appAkin = require('./appakin.js');

    appAkin.factory('appService', function() {
        var appService = {pageTitle: 'AppAkin | Ham'};
        return appService;
    });

}()); // use strict