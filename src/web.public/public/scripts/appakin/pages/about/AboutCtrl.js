(function () {'use strict';

    angular.module('appAkin').controller('AboutCtrl', function($scope, $timeout, search, pageTitle, spinner) {
        pageTitle.setPageTitle('About');
        search.resetSearchTerm();

//        var s = spinner('spinner-1', 2000);
//        s();
//
//        $timeout(function() {
//            s.stop();
//        }, 4000);

        //spinner.spin('spinner-1');}, 0)

    });

}()); // use strict
