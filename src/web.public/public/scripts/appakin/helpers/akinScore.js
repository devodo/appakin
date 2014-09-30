(function () {'use strict';

    angular.module('appAkin').directive('akinScore', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: '/public/templates/appakin/helpers/akin-score.html',
            scope: {
                score: '=',
                voteCount: '=votes'
            },
            controller: function ($scope) {
                $scope.getIconClass = function(index, score) {
                    var lowerScore = Math.floor(score);
                    var upperScore = lowerScore + 1;

                    if (index < lowerScore || (index === lowerScore && score > (lowerScore + 0.75))) {
                        return 'filled';
                    } else if (index >= upperScore || (index === lowerScore && score < (lowerScore + 0.25))) {
                        return 'empty';
                    }

                    return 'half-filled';
                };

                $scope.getIndexClass = function(index) {
                    switch (index) {
                        case 0: return 'zero';
                        case 1: return 'one';
                        case 2: return 'two';
                        case 3: return 'three';
                        default: return 'four';
                    }
                };
            }
        };
    });

}()); // use strict
