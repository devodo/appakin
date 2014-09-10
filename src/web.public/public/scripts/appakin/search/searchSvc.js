(function () {
    'use strict';

    angular.module('appAkin').factory('search', function(httpGet, debounce, $timeout, $location, $rootScope, platform) {
        var me = this;
        var defaultItemsPerPage = 10;
        var maxItemsPerPage = 50;
        var defaultCurrentPage = 1;
        var debounceTimeoutMs = 200;

        var searchApi = httpGet();
        var autoCompleteApi = httpGet();

        var debouncedAutoCompleteApi = debounce(
            function(currentSearchTerm, currentPlatform) {
                var store = platform.getApiName(currentPlatform);

                autoCompleteApi(
                    'search/'+store+'/auto?q='+encodeURIComponent(currentSearchTerm),
                    function(data) {
                        me.service.autoComplete.terms = data;
                    }
                );
            },
            debounceTimeoutMs);

        me.service = {
            searchTerm: '',
            platform: platform.getInitialPlatform(),
            results: {
                categories: [],
                currentPage: defaultCurrentPage,
                itemsPerPage: defaultItemsPerPage,
                totalItems: 0,
                initialState: true,
                serverError: false,
                searchInProgress: false
            },
            autoComplete: {
                active: true,
                terms: []
            },
            resetSearchTerm: function() {
                me.service.searchTerm = '';
            },
            getPlaceholderText: function() {
                return 'Search ' +
                    platform.getFriendlyName(me.service.platform) +
                    ' apps';
            },
            cancelAutoComplete: function() {
                debouncedAutoCompleteApi.cancel();
                autoCompleteApi.cancel();
            },
            updateAutoCompleteTerms: function(typed) {
                var currentSearchTerm = me.service.searchTerm;
                var currentPlatform = me.service.platform;

                if (currentSearchTerm === '') {
                    me.service.autoComplete.terms = [];
                    me.service.cancelAutoComplete();
                    return;
                }

                debouncedAutoCompleteApi(currentSearchTerm, currentPlatform);
            },
            resetSearchResults: function() {
                me.service.results.categories = [];
                me.service.results.currentPage = defaultCurrentPage;
                me.service.results.itemsPerPage = defaultItemsPerPage;
                me.service.results.totalItems = 0;
                me.service.results.initialState = true;
                me.service.results.serverError = false;
                me.service.results.searchInProgress = false;
            },
            updateSearchFromUrl: function() {
                var search = $location.search();

                if (search.q !== me.service.searchTerm) {
                    me.service.searchTerm = search.q;

                    me.service.autoComplete.active = false;
                    $timeout(function() {me.service.autoComplete.active = true; console.log('set');}, 0);
                }

                if (search.p !== me.service.platform) {
                    me.service.platform = platform.normalisePlatform(search.p) || platform.defaultPlatform;
                }

                if (search.page) {
                    var pageInt = parseInt(search.page);

                    if (!isNaN(pageInt) && pageInt > 0 && pageInt != me.service.results.currentPage) {
                        me.service.results.currentPage = pageInt;
                    }
                } else {
                    me.service.results.currentPage = defaultCurrentPage;
                }

                if (search.take) {
                    var takeInt = parseInt(search.take);

                    if (!isNaN(takeInt) && takeInt > 0 && takeInt < maxItemsPerPage && takeInt != me.service.results.itemsPerPage) {
                        me.service.results.itemsPerPage = takeInt;
                    }
                } else {
                    me.service.results.itemsPerPage = defaultItemsPerPage;
                }
            },
            search : function() {
                var a = httpGet('a');
                var b = httpGet('b');

                if (me.service.searchTerm === '') {
                    me.service.results.initialState = false;
                    return;
                }

                me.service.results.searchInProgress = true;

                searchApi.cancel();

                searchApi(
                    'search?q='+encodeURIComponent(me.service.searchTerm)+
                        '&p='+encodeURIComponent(me.service.platform)+
                        '&page='+encodeURIComponent(me.service.results.currentPage)+
                        '&take='+encodeURIComponent(me.service.results.itemsPerPage),
                    function(data) {
                        me.service.results.categories = data.categories;
                        me.service.results.totalItems = data.totalItems;
                        me.service.results.currentPage = data.page;
                        me.service.results.initialState = false;
                        me.service.results.serverError = false;
                        me.service.results.searchInProgress = false;
                    },
                    function(data) {
                        me.service.results.serverError = true;
                        me.service.results.searchInProgress = false;
                    }
                );
            },
            submitSearch: function(page) {
                if (me.service.searchTerm === '') {
                    return;
                }

                me.service.cancelAutoComplete();
                me.service.autoComplete.terms = [];

                var search = {
                    q: me.service.searchTerm,
                    p: me.service.platform
                };

                if (page > 1) {
                    search.page = page;
                }

                console.log('redirecting to search: q=' + me.service.searchTerm + ' p=' + me.service.platform + ' page=' + page);
                $location.path('/search').search(search);
            }
        };

        $rootScope.$watch(
            function () {
                return me.service.platform;
            },
            function () {
                platform.persistPlatform(me.service.platform);
            }
        );

        return me.service;
    });

}()); // use strict
