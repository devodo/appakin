(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('SearchCtrl', ['$scope', 'navigationService', 'searchService',
        function($scope, navigationService, searchService) {
            navigationService.setPageTitle('Search');

            $scope.message = 'Search results!';

            searchService.search(
                function(data) { alert('got data'); },
                function() { alert('got error'); }
            );
        }]);

}()); // use strict
