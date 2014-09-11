(function () {
    'use strict';

    angular.module('appAkin').factory('search', function(httpGet, debounce, $timeout, $location, $rootScope, platform) {
        var me = this;
        var defaultItemsPerPage = 10;
        var maxItemsPerPage = 50;
        var defaultCurrentPage = 1;
        var debounceTimeoutMs = 200;
        var searchResultsPagePath = '/search';
        var defaultSearchType = 'category';
        var searchTypeRegex = /(category|app)/;

        var searchApi = httpGet();
        var autoCompleteApi = httpGet();

        var debouncedAutoCompleteApi = debounce(
            function(currentSearchTerm, currentPlatform) {
                var platformApiName = platform.getApiName(currentPlatform);

                autoCompleteApi(
                    platformApiName+'/search/auto?q='+encodeURIComponent(currentSearchTerm),
                    function(data) {
                        me.service.autoComplete.terms = data;
                    }
                );
            },
            debounceTimeoutMs);

        function normaliseSearchType(value) {
            return !searchTypeRegex.test(value) ? undefined : value;
        };

        me.service = {
            searchTerm: '',
            platform: platform.getInitialPlatform(),
            searchType: defaultSearchType,
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
            resetSearchType: function() {
                me.service.searchType = defaultSearchType;
            },
            getPlaceholderText: function() {
                return 'Search ' +
                    platform.getFriendlyName(me.service.platform) +
                    ' apps';
            },
            cancelAutoComplete: function() {
                debouncedAutoCompleteApi.cancel();
                autoCompleteApi.cancel();
                me.service.autoComplete.terms = [];
            },
            cancelSearch: function() {
                searchApi.cancel();
            },
            updateAutoCompleteTerms: function(typed) {
                var currentSearchTerm = me.service.searchTerm;
                var currentPlatform = me.service.platform;

                if (currentSearchTerm === '') {
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
            urlMatchesSearch: function() {
                var search = $location.search();
                var pageInt = null;
                var takeInt = null;
                var searchType = defaultSearchType;

                if (search.page) {
                    pageInt = parseInt(search.page);
                    if (isNaN(pageInt)) {pageInt = null;}
                }

                if (search.take) {
                    takeInt = parseInt(search.take);
                    if (isNaN(takeInt)) {takeInt = null;}
                }

                if (search.type) {
                    searchType = search.type;
                }

                var searchTermMatches = search.q === me.service.searchTerm;
                var platformMatches = search.p === me.service.platform;
                var searchTypeMatches = searchType === me.service.searchType;
                var pageMatches = pageInt === me.service.results.currentPage;
                var takeMatches = takeInt === me.service.results.itemsPerPage;
                // Note: currentPage is a string!
                var pageIsDefault = pageInt === null && me.service.results.currentPage == defaultCurrentPage;
                var takeIsDefault = takeInt === null && me.service.results.itemsPerPage === defaultItemsPerPage;

                return searchTermMatches && platformMatches && searchTypeMatches &&
                    (pageMatches || pageIsDefault) &&
                    (takeMatches || takeIsDefault);
            },
            updateSearchFromUrl: function() {
                var search = $location.search();

                if (search.q !== me.service.searchTerm) {
                    me.service.searchTerm = search.q;

                    // Stop autocomplete dropdown appearing at first.
                    me.service.autoComplete.active = false;
                    $timeout(function() {me.service.autoComplete.active = true;}, 0);
                }

                if (search.p !== me.service.platform) {
                    me.service.platform = platform.normalisePlatform(search.p) || platform.defaultPlatform;
                }

                if (search.type) {
                    me.service.searchType = normaliseSearchType(search.type) || defaultSearchType;
                } else {
                    me.service.searchType = defaultSearchType;
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
            submitSearch: function(page) {
                if (me.service.searchTerm === '') {
                    return;
                }

                me.service.cancelAutoComplete();

                var search = {
                    q: me.service.searchTerm,
                    p: me.service.platform
                };

                if (page > 1) {
                    search.page = page;
                }

                if ($location.path() !== searchResultsPagePath) {
                    me.service.resetSearchType();
                } else if (me.service.searchType !== defaultSearchType) {
                    search.type = me.service.searchType;
                }

                // If the exact same search is being submitted on the search results page,
                // we need to manually call search();
                if ($location.path() === searchResultsPagePath && me.service.urlMatchesSearch()) {
                    me.service.search();
                }
                else {
                    console.log('redirecting to search: q=' + me.service.searchTerm + ' p=' + me.service.platform + ' page=' + page);
                    $location.path(searchResultsPagePath).search(search);
                }
            },
            // Call submitSearch() rather than search() directly.
            search : function() {
                if (me.service.searchTerm === '') {
                    me.service.results.initialState = false;
                    return;
                }

                console.log(me.service.results.currentPage);

                me.service.results.searchInProgress = true;
                var localPlatform = me.service.platform;

                searchApi(
                    'search?q='+encodeURIComponent(me.service.searchTerm) +
                        '&p='+encodeURIComponent(me.service.platform) +
                        '&type='+encodeURIComponent(me.service.searchType) +
                        '&page='+encodeURIComponent(me.service.results.currentPage) +
                        '&take='+encodeURIComponent(me.service.results.itemsPerPage),
                    function(data) {
                        // Add in category
                        var i;
                        for (i = 0; i < data.categories.length; ++i) {
                            data.categories[i].platform = localPlatform;
                        }

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
