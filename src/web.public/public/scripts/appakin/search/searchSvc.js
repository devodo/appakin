(function () {
    'use strict';

    angular.module('appAkin').factory('search', function(autoComplete) {
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
                console.log('redirecting to search');
            },
            updateAutoCompleteTerms: function(typed) {
                console.log('updating autocomplete terms: [' + typed + '] [' + self.service.searchTerm + ']');

                if (typed.length < 2) {
                    if (self.service.autoCompleteTerms.length > 0) {
                        self.service.autoCompleteTerms = [];
                    }

                    return;
                }

                var currentSearchTerm = self.service.searchTerm;

                autoComplete.query(
                    { q: self.service.searchTerm, p: self.service.platform },
                    function(data) {
                        setTimeout(function() {
                            console.log(currentSearchTerm + ' ' + self.service.searchTerm);

                            if (currentSearchTerm !== self.service.searchTerm)
                            {
                                console.log('too late');
                                return;
                            }

                            self.service.autoCompleteTerms = data;
                            console.log(data);
                        }, 3000);
                    }


//                    function(data) {
//                        if (currentSearchTerm !== self.service.searchTerm)
//                        {
//                            console.log('too late');
//                            return;
//                        }
//
//                        self.service.autoCompleteTerms = data;
//                        console.log(data);
//                    }
                );
            }
        };

        return self.service;
    });

}()); // use strict
