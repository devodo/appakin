(function () {
    'use strict';

    angular.module('appAkin').directive('searchInput', function($timeout, $rootScope) {
        var key = {left: 37, up: 38, right: 39, down: 40 , enter: 13, esc: 27};

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
            controller: ['$scope', '$timeout', '$document', function($scope, $timeout, $document) {
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
                    if (value) {
                        $document.scrollTop(0);
                    }

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
                    //$scope.inputElement[0].blur();
                };

                $scope.clear = function(e) {
                    $scope.searchParam = '';
                    e.preventDefault();
                    e.stopPropagation();
                };

                $scope.$on('$destroy', function() {
                    document.removeEventListener('keydown', $scope.documentKeydownEventListener, true);
                    $scope.documentKeydownEventListener = null;

                    $scope.inputElement[0].removeEventListener('focus', $scope.inputFocusEventListener);
                    $scope.inputFocusEventListener = null;

                    $scope.inputElement[0].removeEventListener('blur', $scope.inputBlurEventListener, true);
                    $scope.inputBlurEventListener = null;

                    $scope.element[0].removeEventListener('keydown', $scope.elementKeydownEventListener);
                    $scope.elementKeydownEventListener = null;

                    if ($scope.inputFocusTimeout) { $timeout.cancel($scope.inputFocusTimeout); }

                    $scope.inputElement = null;
                    $scope.element = null;
                });
            }],
            link: function(scope, element, attrs){
                scope.inputElement = angular.element(element.find('input')[0]);
                scope.element = element;

                // document keydown

                scope.documentKeydownEventListener = function(e) {
                    var keycode = e.keyCode || e.which;

                    switch (keycode){
                        case key.esc:
                            // disable suggestions on escape
                            scope.select();
                            scope.setIndex(-1);
                            scope.$apply();
                            e.preventDefault();
                    }
                };

                document.addEventListener(
                    'keydown',
                    scope.documentKeydownEventListener, true);

                // input focus

                scope.inputFocusEventListener = function (e) {
                    var me = this;

                    $rootScope.$broadcast('autocomplete.focused');

                    if (scope.inputFocusTimeout) {
                        $timeout.cancel(scope.inputFocusTimeout);
                    }

                    scope.inputFocusTimeout = $timeout(function() {
                        var len = scope.searchParam.length;

                        if (scope.inputElement[0].setSelectionRange) {
                            scope.inputElement[0].setSelectionRange(len, len);
                        }

                        if (document.createEvent) {
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
                };

                scope.inputElement[0].addEventListener(
                    'focus',
                    scope.inputFocusEventListener);

                // input blur

                scope.inputBlurEventListener = function(e) {
                    scope.select();
                    scope.setIndex(-1);
                    scope.$apply();
                    $rootScope.$broadcast('autocomplete.blurred');
                };

                scope.inputElement[0].addEventListener(
                    'blur',
                    scope.inputBlurEventListener, true); // capturing

                // element keydown

                scope.elementKeydownEventListener = function (e) {
                    var keycode = e.keyCode || e.which;
                    var index = -1;

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
                };

                scope.element[0].addEventListener(
                    'keydown',
                    scope.elementKeydownEventListener);
            },
            templateUrl: '/public/templates/appakin/search/akin-searchinput.html'
        };
    });

    angular.module('appAkin').directive('searchSuggestion', function(){
        return {
            restrict: 'A',
            require: '^searchInput', // ^look for controller on parents element
            controller: ['$scope', function($scope) {
                $scope.$on('$destroy', function() {
                    $scope.element.unbind();
                    $scope.element = null;
                });
            }],
            link: function(scope, element, attrs, autoCtrl){
                scope.element = element;

                element.bind('mouseenter', function() {
                    autoCtrl.setIndex(attrs.index);
                });

                element.bind('mousedown', function() {
                    scope.select(element.text());
                    autoCtrl.setIndex(-1);
                    scope.$apply();
                });
            }
        };
    });

}()); // use strict
