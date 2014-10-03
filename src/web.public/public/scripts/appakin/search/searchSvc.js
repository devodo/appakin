(function () {
    'use strict';

    angular.module('appAkin').factory('search',
        function(httpGet, debounce, $timeout, $location, $rootScope, $route, platform, url) {
            var me = this;
            var defaultCurrentPage = 1;
            var debounceTimeoutMs = 200;
            var defaultSearchType = 'category';
            var searchTypeRegex = /(category|app)/;
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
            }

            function createResultsObject(isInitialState) {
                return {
                    items: [],
                    totalItems: 0,
                    //initialState: isInitialState,
                    serverError: false,
                    searchType: defaultSearchType,
                    suggestion: null,
                    resultSearchTerm: null
                };
            }

            me.service = {
                searchTerm: '',
                platform: platform.getInitialPlatform(),
                currentPage: defaultCurrentPage,
                searchType: defaultSearchType,
                searchInProgress: false,
                results: createResultsObject(true),
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
                    me.service.results = createResultsObject(true);
                },
                urlMatchesSearch: function(targetPage) {
                    var search = $location.search();
                    var pageInt = null;
                    var takeInt = null;
                    var searchType = defaultSearchType;

                    if (search.page) {
                        pageInt = parseInt(search.page);
                        if (isNaN(pageInt)) {
                            pageInt = defaultCurrentPage;
                        }
                    } else {
                        pageInt = defaultCurrentPage;
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
                    var pageMatches = pageInt === targetPage;
                    return searchTermMatches && platformMatches && searchTypeMatches && pageMatches;
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

                        if (!isNaN(pageInt) && pageInt > 0 && pageInt != me.service.currentPage) {
                            me.service.currentPage = pageInt;
                        }
                    } else {
                        me.service.currentPage = defaultCurrentPage;
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
                    } else {
                        search.page = null;
                    }

                    var onSearchResultsPage = url.onSearchResultsPage($location.path());

                    if (!onSearchResultsPage) {
                        me.service.resetSearchType();
                    } else if (me.service.searchType !== defaultSearchType) {
                        search.type = me.service.searchType;
                    }

                    var currentSearch = $location.search();

                    var locationNotChanging =
                        onSearchResultsPage &&
                        currentSearch.q === search.q &&
                        currentSearch.p === search.p &&
                        (currentSearch.page === search.page || (!currentSearch.page && !search.page)) &&
                        (currentSearch.type === search.type || (!currentSearch.type && search.type === defaultSearchType));

                    // console.log('locationPath=' + $location.path() +
                    // '  q=' + currentSearch.q + ' p=' + currentSearch.p +
                    // ' page=' + currentSearch.page + ' type=' + currentSearch.type);

                    console.log('redirecting to search: q=' + me.service.searchTerm + ' p=' + me.service.platform + ' page=' + page);
                    $location.path(url.searchResultsPagePath).search(search);

                    if (locationNotChanging) {
                        console.log('location not changing');
                        $route.reload();
                    }
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
