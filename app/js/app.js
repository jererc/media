'use strict';

angular.module('mediaApp', ['mediaServices', 'mediaDirectives', 'mediaFilters', 'angularUtils']).
    config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {redirectTo: '/media'}).
        when('/media', {templateUrl: 'partials/media-list.html', controller: MediaListCtrl}).
        when('/syncs', {templateUrl: 'partials/sync-list.html', controller: SyncListCtrl}).
        when('/settings', {templateUrl: 'partials/settings-list.html', controller: SettingsListCtrl}).
        otherwise({redirectTo: '/'});
}]);


angular.module('mediaApp').config(function($compileProvider){
  $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|magnet):/);
});
