(function () {
    'use strict';

    angular.module('appAkin').directive('searchInput', function($timeout, $rootScope) {
        var index = -1;

        return {
            restrict: 'E',
            scope: {
                searchParam: '=ngModel',
                suggestions: '=data',
                onType: '=onType',
                onSelect: '=onSelect',
                isActive: '=isActive',
                placeholder: '=placeholder'
            },
            controller: ['$scope', '$timeout', function($scope, $timeout){
                // the index of the suggestions that's currently selected
                $scope.selectedIndex = -1;

                // set new index
                $scope.setIndex = function(i){
                    $scope.selectedIndex = parseInt(i);
                };

                this.setIndex = function(i){
                    $scope.setIndex(i);
                    $scope.$apply();
                };

                $scope.getIndex = function(i){
                    return $scope.selectedIndex;
                };

                // Focus variable
                $scope.hasFocus = false;

                $scope.setFocus = function(value) {
                    $scope.hasFocus = value;
                };

                // drop down on/off
                $scope.completing = false;

                // starts autocompleting on typing in something
                $scope.$watch('searchParam', function (newValue, oldValue) {
                    if (oldValue === newValue) {
                        return;
                    }

                    if (!$scope.isActive) {
                        return;
                    }

                    if ($scope.searchParam) {
                        $scope.completing = true;
                        $scope.selectedIndex = -1;
                    }

                    if ($scope.onType) {
                        $scope.onType($scope.searchParam);
                    }
                });

                // selecting a suggestion with RIGHT ARROW or ENTER
                $scope.select = function(suggestion){
                    if(suggestion){
                        $scope.searchParam = suggestion;
                        $scope.searchFilter = suggestion;

                        if($scope.onSelect) {
                            $scope.onSelect(suggestion);
                        }
                    }

                    $scope.completing = false;
                    $scope.setIndex(-1);
                };

                $scope.clear = function(e) {
                    $scope.searchParam = '';
                    e.preventDefault();
                }
            }],
            link: function(scope, element, attrs){
                var inputElement = angular.element(element.find('input')[0]);
                var key = {left: 37, up: 38, right: 39, down: 40 , enter: 13, esc: 27};

                document.addEventListener('keydown', function(e) {
                    var keycode = e.keyCode || e.which;

                    switch (keycode){
                        case key.esc:
                            console.log('esc pressed');

                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                    }
                }, true);

                inputElement[0].addEventListener('focus', function (e) {
                    var me = this;

                    $rootScope.$broadcast('autocomplete.focused');

                    $timeout(function() {
                        console.log('timeout ' +scope.searchParam.length);
                        var len = scope.searchParam.length;

                        if (inputElement[0].setSelectionRange) {
                            inputElement[0].setSelectionRange(len, len);
                        }

                        if (document.createEvent) {
                            console.log('triggering keypresses');

                            // Trigger a space keypress.
                            var e = document.createEvent('KeyboardEvent');
                            if (typeof(e.initKeyEvent) != 'undefined') {
                                e.initKeyEvent('keypress', true, true, null, false, false, false, false, 0, 32);
                            } else {
                                e.initKeyboardEvent('keypress', true, true, null, false, false, false, false, 0, 32);
                            }
                            me.dispatchEvent(e);

                            // Trigger a backspace keypress.
                            e = document.createEvent('KeyboardEvent');
                            if (typeof(e.initKeyEvent) != 'undefined') {
                                e.initKeyEvent('keypress', true, true, null, false, false, false, false, 8, 0);
                            } else {
                                e.initKeyboardEvent('keypress', true, true, null, false, false, false, false, 8, 0);
                            }

                            me.dispatchEvent(e);
                        }
                    }, 0);
                });

                inputElement[0].addEventListener('blur', function(e) {
                    scope.select();
                    scope.setIndex(-1);
                    scope.$apply();

                    $rootScope.$broadcast('autocomplete.blurred');
                }, true); // capturing

                element[0].addEventListener('keydown', function (e) {
                    var keycode = e.keyCode || e.which;

                    var l = angular.element(this).find('li').length;

                    // implementation of the up and down movement in the list of suggestions
                    switch (keycode){
                        case key.up:

                            index = scope.getIndex()-1;
                            if(index<-1){
                                index = l-1;
                            } else if (index >= l ){
                                index = -1;
                                scope.setIndex(index);
                                break;
                            }
                            scope.setIndex(index);
                            scope.$apply();

                            break;
                        case key.down:
                            index = scope.getIndex()+1;
                            if(index<-1){
                                index = l-1;
                            } else if (index >= l ){
                                index = -1;
                                scope.setIndex(index);
                                scope.$apply();
                                break;
                            }
                            scope.setIndex(index);
                            scope.$apply();

                            break;
                        case key.enter:

                            index = scope.getIndex();

                            if(index !== -1) {
                                scope.select(angular.element(angular.element(this).find('li')[index]).text());
                            }

                            scope.setIndex(-1);
                            scope.$apply();

                            break;
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                            break;
                        default:
                            return;
                    }

                    if (scope.getIndex() !== -1) {
                        e.preventDefault();
                    }
                });
            },
            templateUrl: '/public/templates/appakin/search/akin-searchinput.html'
        };
    });

    angular.module('appAkin').directive('searchSuggestion', function(){
        return {
            restrict: 'A',
            require: '^searchInput', // ^look for controller on parents element
            link: function(scope, element, attrs, autoCtrl){
                element.bind('mouseenter', function() {
                    autoCtrl.setIndex(attrs.index);
                });

                element.bind('mousedown', function() {
                    scope.select(element.text());
                    autoCtrl.setIndex(-1);
                    scope.$apply();
                })
            }
        };
    });

}()); // use strict
