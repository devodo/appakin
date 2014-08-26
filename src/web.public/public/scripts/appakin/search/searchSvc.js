(function () {
    'use strict';

    angular.module('appAkin').factory('search', function(autoComplete, $rootScope, $q) {
        var self = this;
        var defaultItemsPerPage = 10;

        var initialPlatform = 'ios';

        self.service = {
            searchTerm: '',
            autoCompleteTerms: [],
            platform: initialPlatform,
            pageNumber: 1,
            itemsPerPage: defaultItemsPerPage,
            totalItems: 0,
            redirectToSearch: function() {
                self.service.autoCompleteTerms = [];

                // TODO: cancel incoming autocompletes?

                console.log('redirecting to search');
            },
            updateAutoCompleteTerms: function(typed) {
                //console.log('updating autocomplete terms: [' + typed + '] [' + self.service.searchTerm + ']');

                var currentSearchTerm = self.service.searchTerm;

                return autoComplete
                    .query({ q: self.service.searchTerm, p: self.service.platform })
                    .$promise
                    .then(function(data) {
                        if (currentSearchTerm !== self.service.searchTerm)
                        {
                            console.log('discarding autocomplete results')
                            return $q.reject();
                        }

                        self.service.autoCompleteTerms = data;
                    });
            }
        };

        return self.service;
    });

}()); // use strict
