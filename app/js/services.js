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

    //
    // Event
    //
    services.service('eventSvc', function($rootScope) {

        this.emit = function(event, args) {
            $rootScope.$broadcast(event, args);
        };

    });

    //
    // Utils
    //
    services.service('utilsSvc', function() {

        this.mobile = (navigator.userAgent.match(/iPhone|iPod|iPad|Android|WebOS|Blackberry|Symbian|Bada/i) != null);
        this.focus = true;

        var self = this;
        $(window).
            blur(function() {
                self.focus = false;
            }).
            focus(function() {
                self.focus = true;
            });

        this.now = function() {
            return new Date().getTime();
        };

        this.updateUrlQuery = function(url, key, value) {
            var sep = (url.indexOf('?') == -1) ? '?' : '&';
            return url + sep + key + '=' + value;
        };

        this.getIndex = function(value, array) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (array[i] == value) {
                    return i;
                }
            }
            return -1;
        };

        this.updateList = function(src, dst, key, skip, limit) {
            var skip = (skip != undefined) ? skip : 0;
            var limit = (limit != undefined) ? limit : Math.max(src.length, dst.length);
            var key = (key != undefined) ? key : 'id';
            var toRemove = 0;
            var i0;
            for (var i1 = 0; i1 < limit; i1++) {
                i0 = i1 + skip;
                if (src[i0] || dst[i1]) {
                    if (src[i0] && dst[i1]) {
                        if (src[i0][key] == dst[i1][key]) {
                            angular.extend(src[i0], dst[i1])
                        } else {
                            src[i0] = dst[i1];
                        }
                    } else if (!src[i0]) {
                        src.push(dst[i1]);
                    } else if (!dst[i1]) {
                        toRemove++;
                        src[i0] = null;
                    }
                }
            }

            if (toRemove) {
                for (var i = src.length; i--;) {
                    if (src[i] == null) {
                        src.splice(i, 1);
                    }
                }
            }
        };

        this.formatPrimitives = function(data, keys, toObj) {
            for (var key in data) {
                if (angular.isArray(data[key]) && this.getIndex(key, keys) != -1) {
                    var val = angular.copy(data[key]);
                    data[key] = [];
                    val.map(function(v) {
                        var isObj = angular.isObject(v);
                        if (isObj ? v.val : v && isObj != !!toObj) {
                            data[key].push(!!isObj ? v.val : {val: v});
                        }
                    });
                } else if (angular.isObject(data[key])) {
                    this.formatPrimitives(data[key], keys, toObj);
                }
            }
        };

    });

})();
