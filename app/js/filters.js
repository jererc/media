'use strict';

(function() {

    var filters = angular.module('mediaFilters', ['ngResource']);

    filters.filter('ifList', function() {
        return function(input) {
            return angular.isArray(input) ? input.join(', ') : input;
        };
    });

    filters.filter('ifDate', function($filter) {
        return function(input) {
            return !!input ? $filter('date')(input * 1000, 'MMM d yyyy HH:mm') : '';
        };
    });

})();
