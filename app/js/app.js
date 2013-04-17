'use strict';

/* App Module */

angular.module('mediaApp', ['mediaServices', 'mediaDirectives', 'mediaFilters']).
    config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {redirectTo: '/media'}).
        when('/media', {templateUrl: 'partials/media-list.html', controller: MediaListCtrl}).
        when('/sync', {templateUrl: 'partials/sync-list.html', controller: SyncListCtrl}).
        when('/settings', {templateUrl: 'partials/settings-list.html', controller: SettingsListCtrl}).
        otherwise({redirectTo: '/'});
}]);
