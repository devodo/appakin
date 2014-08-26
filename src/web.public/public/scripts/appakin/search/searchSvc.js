(function () {
    'use strict';

    angular.module('appAkin').factory('search', function(autoComplete, $rootScope, $q, $timeout) {
        var self = this;

        var defaultItemsPerPage = 10;
        var debounceTimeoutMs = 100;
        var initialPlatform = 'ios';

        var debounceTimeout;
        var autoCompleteSessionVersion = 0;

        self.service = {
            searchTerm: '',
            autoCompleteTerms: [],
            platform: initialPlatform,
            pageNumber: 1,
            itemsPerPage: defaultItemsPerPage,
            totalItems: 0,
            redirectToSearch: function() {
                self.service.autoCompleteTerms = [];
                ++autoCompleteSessionVersion;

                console.log('redirecting to search');
            },
            updateAutoCompleteTerms: function(typed) {
                if (typed.length === 0) {
                    self.service.autoCompleteTerms = [];
                    return;
                }

                var currentSearchTerm = self.service.searchTerm;
                var currentAutoCompleteSessionVersion = autoCompleteSessionVersion;

                if (debounceTimeout) {
                    $timeout.cancel(debounceTimeout);
                }

                debounceTimeout = $timeout(function() {
                    if (currentSearchTerm !== self.service.searchTerm)
                    {
                        return;
                    }

                    console.log('making autocomplete request');

                    autoComplete.query(
                        { q: self.service.searchTerm, p: self.service.platform },
                        function(data) {
                            if (currentSearchTerm !== self.service.searchTerm)
                            {
                                console.log('rejected autocomplete because search term has changed')
                                return $q.reject();
                            }

                            if (currentAutoCompleteSessionVersion !== autoCompleteSessionVersion)
                            {
                                console.log('rejected autocomplete because search version has changed')
                                return $q.reject();
                            }

                            self.service.autoCompleteTerms = data;
                        }
                    );
                }, debounceTimeoutMs);
            }
        };

        return self.service;
    });

}()); // use strict
