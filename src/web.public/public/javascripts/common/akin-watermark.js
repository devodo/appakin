(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.directive("akinWatermark", ["$timeout", function($timeout) {
        var watermarkedClass = 'watermarked';
        
        return {
            restrict: 'A',
            link: function(scope, element, attrs, control) {
                if(attrs.type === 'password') {
                    return;
                }

                $timeout(function() {
                    var onFocus = function(){
                        if(element.val() === attrs.akinWatermark) {
                            element.val('');
                            element.removeClass(watermarkedClass);
                        }
                    };

                    var onBlur = function(){
                        if(element.val() === '') {
                            element.val(attrs.akinWatermark);
                            element.addClass(watermarkedClass)
                        }
                    };

                    element.bind("focus", onFocus);
                    element.bind("blur", onBlur);
                    element.triggerHandler("blur");
                });
            }
        }
}]);

}()); // use strict
