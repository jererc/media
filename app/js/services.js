'use strict';

(function() {

    var services = angular.module('mediaServices', ['ngResource', 'ngCookies']);


    //
    // API
    //
    services.service('apiSvc', function($http, $cookieStore) {

        this.getSettingsUrl = function() {
            return $http.get('local_settings.json');
        };

        this.getUrl = function() {
            return $cookieStore.get('mediaApiUrl');
        };

        this.setUrl = function(url) {
            $cookieStore.put('mediaApiUrl', url);
        };

        this.checkUrl = function(url) {
            return $http.get(url + '/status');
        };

    });


    //
    // Media
    //
    services.service('mediaSvc', function($http, apiSvc, utilsSvc) {

        this.createMedia = function(data) {
            return $http.post(apiSvc.getUrl() + '/media/create/media', data);
        };

        this.createSimilar = function(data) {
            return $http.post(apiSvc.getUrl() + '/media/create/similar', data);
        };

        this.listMedia = function(type, skip, limit, category, sort, query) {
            var url = apiSvc.getUrl() + '/media/list/' + type + '/' + skip + '/' + limit;
            if (category && category != 'all') {
                url = utilsSvc.updateUrlQuery(url, 'category', category);
            }
            if (sort) {
                url = utilsSvc.updateUrlQuery(url, 'sort', sort);
            }
            if (query) {
                url = utilsSvc.updateUrlQuery(url, 'query', query);
            }
            return $http.get(url);
        };

        this.updateSearch = function(data) {
            return $http.post(apiSvc.getUrl() + '/media/update/search', data);
        };

        this.updateSimilar = function(data) {
            return $http.post(apiSvc.getUrl() + '/media/update/similar', data);
        };

        this.resetSearch = function(id) {
            return $http.post(apiSvc.getUrl() + '/media/reset/search',
                {id: id});
        };

        this.shareMedia = function(id, user, path) {
            return $http.post(apiSvc.getUrl() + '/media/share',
                {id: id, user: user, path: path});
        };

        this.removeMedia = function(ids, type) {
            return $http.post(apiSvc.getUrl() + '/media/remove',
                {ids: ids, type: type});
        };

    });


    //
    // Sync
    //
    services.service('syncSvc', function($http, apiSvc) {

        this.createSync = function(data) {
            return $http.post(apiSvc.getUrl() + '/sync/create', data);
        };

        this.listSyncs = function() {
            return $http.get(apiSvc.getUrl() + '/sync/list');
        };

        this.listUsers = function() {
            return $http.get(apiSvc.getUrl() + '/user/list');
        };

        this.updateSync = function(data) {
            return $http.post(apiSvc.getUrl() + '/sync/update', data);
        };

        this.resetSync = function(id) {
            return $http.post(apiSvc.getUrl() + '/sync/reset',
                {id: id});
        };

        this.removeSync = function(id) {
            return $http.post(apiSvc.getUrl() + '/sync/remove',
                {id: id});
        };

    });


    //
    // Settings
    //
    services.service('settingsSvc', function($http, apiSvc) {

        this.listSettings = function() {
            return $http.get(apiSvc.getUrl() + '/settings/list');
        };

        this.updateSettings = function(data) {
            return $http.post(apiSvc.getUrl() + '/settings/update', data);
        };

    });


})();
