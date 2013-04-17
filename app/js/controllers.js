'use strict';


//
// Main
//
function MainCtrl($rootScope, $scope, $location, $timeout, syncSvc, eventSvc, utilsSvc) {

    $rootScope.users = [];
    $rootScope.user;

    $rootScope.types = [
        {name: 'Media', value: 'media'},
        {name: 'Releases', value: 'release'},
        {name: 'Searches', value: 'search'},
        {name: 'Similar', value: 'similar'},
        ];
    $rootScope.type = $rootScope.types[0];

    $rootScope.categories = [
        {name: 'All', value: 'all'},
        {name: 'Movies', value: 'movies'},
        {name: 'TV shows', value: 'tv'},
        {name: 'Anime', value: 'anime'},
        {name: 'Music', value: 'music'},
        ];
    $rootScope.category = $rootScope.categories[0];

    $rootScope.sorts = [
        {name: 'By date', value: 'date'},
        {name: 'By name', value: 'name'},
        ];
    $rootScope.sort = $rootScope.sorts[0];

    $rootScope.query = '';

    $rootScope.modesNames = {
        inc: 'search following episodes',
        once: 'search once',
        ever: 'search forever',
    };
    $rootScope.modesTv = ['inc', 'once', 'ever'];
    $rootScope.modes = ['once', 'ever'];

    $rootScope.langsNames = {
        en: 'english',
        fr: 'french',
    };
    $rootScope.langs = ['en', 'fr'];

    $rootScope.filterNames = {
        genre_incl: 'genre inclusions',
        genre_excl: 'genre exclusions',
    };

    $rootScope.similarRecurrence = 48;

    var usersDelta = 30000;
    var usersTimeout;

    function updateUsers() {
        $timeout.cancel(usersTimeout);
        if (!utilsSvc.focus) {
            usersTimeout = $timeout(updateUsers, usersDelta);
        } else {
            syncSvc.listUsers().
                error(function() {
                    usersTimeout = $timeout(updateUsers, usersDelta);
                }).
                success(function(data) {
                    utilsSvc.updateList($rootScope.users, data.result);
                    if (!$rootScope.user) {
                        $rootScope.user = $rootScope.users[0];
                    }
                    usersTimeout = $timeout(updateUsers, usersDelta);
                });
        }
    }

    $rootScope.setType = function(type) {
        $rootScope.type = type;
        eventSvc.emit('loadMediaGrid');
    };

    $rootScope.isMenuActive = function(path) {
        if ($location.path().substr(0, path.length) == path) {
            return 'active';
        }
        return '';
    };

    $rootScope.inArray = function(value, array) {
        if (!array) {
            return -1;
        }
        return utilsSvc.getIndex(value, array) != -1;
    };

    $rootScope.exists = function(val) {
        if (angular.isArray(val)) {
            return !!val.length;
        } else {
            return !!val;
        }
    };

    updateUsers();

}


//
// Add modals
//
function AddModalCtrl($rootScope, $scope, mediaSvc, syncSvc, eventSvc, utilsSvc) {

    $scope.media = {};
    $scope.similar = {};
    $scope.sync = {};
    $scope.userPath = '';

    function setSyncUser() {
        if ($scope.sync && $scope.user) {
            $scope.sync.user = $scope.user.id;
        }
    }

    function initMediaForm() {
        if ($scope.createMediaForm) {
            $scope.createMediaForm.$setPristine();
        }
        if (utilsSvc.getIndex($scope.media.type, ['tv', 'anime']) != -1) {
            $scope.modes = $rootScope.modesTv;
        } else {
            $scope.modes = $rootScope.modes;
        }
        $scope.media = {
            type: $scope.media.type || 'url',
            mode: $scope.modes[0],
        };
    }

    function initSimilarForm() {
        if ($scope.createSimilarForm) {
            $scope.createSimilarForm.$setPristine();
        }
        $scope.similar = {
            category: $scope.similar.category || 'movies',
            recurrence: $rootScope.similarRecurrence,
        };
    }

    function initSyncForm() {
        if ($scope.createSyncForm) {
            $scope.createSyncForm.$setPristine();
        }
        $scope.sync = {
            category: $scope.sync.category || 'music',
            dst: 'new',
            parameters: {
                genre_incl: [],
                genre_excl: [],
                count_max: 10,
                size_max: 1000,
            },
        };
        setSyncUser();
    }

    //
    // Actions
    //
    $scope.createMedia = function() {
        mediaSvc.createMedia($scope.media).
            success(function(data) {
                if (data.error) {
                    console.error('failed to create media:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.createSimilar = function() {
        mediaSvc.createSimilar($scope.similar).
            success(function(data) {
                if (data.error) {
                    console.error('failed to create similar:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.createSync = function() {
        utilsSvc.formatPrimitives($scope.sync,
                ['genre_incl', 'genre_excl']);

        syncSvc.createSync($scope.sync).
            success(function(data) {
                if (data.error) {
                    console.error('failed to create sync:', data.error);
                } else {
                    eventSvc.emit('updateSyncs');
                }
            });
    };

    //
    // Events
    //
    $rootScope.$on('addModalOpen', function(event, data) {
        initMediaForm();
        initSimilarForm();
        initSyncForm();
    });

    $scope.$watch('media.type', initMediaForm);
    $scope.$watch('similar.category', initSimilarForm);
    $scope.$watch('sync.category', initSyncForm);
    $scope.$watch('user', setSyncUser);

}


//
// Player
//
function PlayerCtrl($rootScope, $scope, $timeout, eventSvc, utilsSvc) {

    var player, _player, queuedVideoId, playerTimeout;

    function onPlayerReady(event) {
        player = _player;
        if (queuedVideoId) {
            play(queuedVideoId);
            queuedVideoId = null;
        }
        if (!$scope.$$phase) $scope.$apply();
    }

    function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.ENDED) {
            eventSvc.emit('playerNextMedia');
            if (!$scope.$$phase) $scope.$apply();
        }
    }

    function initPlayer() {
        _player = new YT.Player('player', {
            width: '100%',
            height: '100%',
            playerVars: {
                wmode: 'opaque',   // fix artifacts
                // autoplay: 1,
                autohide: 1,
                iv_load_policy: 3,
                rel: 0,
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
            }
        });
    }

    window.onYouTubeIframeAPIReady = function() {
        initPlayer();
        if (!$scope.$$phase) $scope.$apply();
    };

    function checkPlayerState() {
        if (player.getPlayerState() == -1) {
            eventSvc.emit('playerNextMedia');
        }
    }

    function play(id) {
        $timeout.cancel(playerTimeout);
        player.loadVideoById(id);
        playerTimeout = $timeout(checkPlayerState, 5000);
    }

    function stop() {
        if (player) {
            $timeout.cancel(playerTimeout);
            player.stopVideo();
        } else if (queuedVideoId) {
            queuedVideoId = null;
        }
    }

    //
    // Events
    //
    $rootScope.$on('playerStart', function(event, data) {
        $scope.media = data.media;
        var videoId = data.media.video_id;
        if (videoId) {
            if (player) {
                play(videoId);
            } else {
                queuedVideoId = videoId;
            }
        }
    });

    $rootScope.$on('playerStop', stop);

}


//
// Media list
//
function MediaListCtrl($rootScope, $scope, $timeout, mediaSvc, eventSvc, utilsSvc) {

    $scope.listView = [];
    $scope.listSelect = [];

    var tWidth = 320;
    var tHeight = 320;
    var tSpacing = 8;
    var rHeight = tHeight + 2 * tSpacing;
    var cacheMin = 50;
    var cacheDelta = 5000;

    var active = true;
    var isCaching = false;
    var scrollPos = 0;
    var scrollPosPrev = 0;

    var listCache, viewBegin, viewEnd, extraRows;
    var cols, firstTop, wHeight;
    var extendTs, updateTs, scrollTimeout, updateTimeout;
    var mediaIndex, mediaPlayed;

    function getMedia(toSkip, toLimit) {
        if (!active) {
            return false;
        }
        var more = toSkip == undefined && toLimit == undefined;
        if (more && (isCaching || utilsSvc.now() - extendTs < cacheDelta)) {
            return false;
        }
        isCaching = true;

        var skip = (toSkip != undefined) ? toSkip : listCache.length;
        var limit = (toLimit != undefined) ? toLimit : cacheMin;
        mediaSvc.listMedia($rootScope.type.value, skip, limit, $rootScope.category.value, $rootScope.sort.value, $rootScope.query).
            error(function() {
                isCaching = false;
                extendTs = utilsSvc.now();
            }).
            success(function(data) {
                isCaching = false;
                if (!data.result.length) {
                    extendTs = utilsSvc.now();
                } else {
                    if (more) {
                        listCache.push.apply(listCache, data.result);
                    } else {
                        utilsSvc.updateList(listCache, data.result, skip, limit);
                    }
                    updateMediaView(!more);
                }
            });
    }

    function updateMediaCache(force, flush) {
        $timeout.cancel(updateTimeout);
        if (!active) {
            return false;
        }
        if (utilsSvc.focus && (force || utilsSvc.now() - updateTs > cacheDelta)) {
            if (flush) {
                getMedia(0, listCache.length);
            } else {
                var limit = (viewEnd > viewBegin) ? viewEnd - viewBegin + 1 : cacheMin;
                getMedia(viewBegin, limit);
            }
        }
        updateTimeout = $timeout(updateMediaCache, cacheDelta);
    }

    function _getCols() {
        cols = 0;
        var top_, top;
        $('.thumbnail-container').each(function() {
            top = $(this).position().top;
            if (top_ && top != top_) {
                return false;
            }
            cols++;
            top_ = top;
        });
        if (!cols) {
            console.error('failed to count columns');
        }
    }

    function _updateFromCache(list, begin, end) {
        end = Math.min(end + 1, listCache.length);
        for (var i = begin; i < end; i++) {
            list[i] = listCache[i];
        }
    }

    function updateMediaView(force) {
        var cacheLen = listCache.length;
        if (!cacheLen) {
            $scope.listView = [];
            return false;
        }

        var _viewBegin = viewBegin;
        var _viewEnd = viewEnd;

        if (firstTop == null) {
            var res = $('.thumbnail-container:first');
            if (res.length) {
                firstTop = res.position().top;
            }
        }
        if (firstTop == null) {
            viewBegin = 0;
            viewEnd = cacheLen - 1;
        } else {
            if (!cols) _getCols();
            var scrollDelta = scrollPos - firstTop + tSpacing;
            viewBegin = cols * Math.floor(scrollDelta / rHeight - extraRows);
            viewBegin = Math.max(viewBegin, 0);
            viewEnd = cols * Math.ceil((scrollDelta + wHeight) / rHeight + extraRows) - 1;
        }

        if (force || viewBegin != _viewBegin || viewEnd != _viewEnd) {
            var viewCount = viewEnd - viewBegin + 1;
            var addCount = cacheLen - $scope.listView.length;
            if (addCount > 0) {
                $scope.listView.push.apply($scope.listView, new Array(addCount));
                if (viewCount) {
                    _updateFromCache($scope.listView, viewBegin, viewEnd);
                }
            } else if (viewCount) {
                var _list = new Array(cacheLen);
                _updateFromCache(_list, viewBegin, viewEnd);
                $scope.listView = _list;
            }

            if (listCache.length < viewBegin + cacheMin) {
                getMedia();
            }
        }
    }

    //
    // Actions
    //
    $scope.initGrid = function() {
        wHeight = $(window).height();
        extraRows = Math.ceil(wHeight / rHeight) + 1;
        cols = 0;
        firstTop = null;
        updateMediaView();
    };

    $scope.loadGrid = function() {
        extendTs = 0;
        updateTs = utilsSvc.now();

        listCache = [];
        $scope.listView = [];
        $scope.listSelect = [];
        $scope.media = null;
        $scope.scrollToTop = false;
        viewBegin = 0;
        viewEnd = 0;
        mediaIndex = 0;
        mediaPlayed = [];

        $scope.initGrid();
        getMedia();
        updateMediaCache();
    };

    $scope.whenScrolled = function() {
        scrollPos = $(window).scrollTop();
        if (scrollPos < 0) {
            return false;
        }
        $timeout.cancel(scrollTimeout);
        if ($(document).height() - scrollPos < 2 * wHeight) {
            $timeout(getMedia, 0);
        }
        if (Math.abs(scrollPos - scrollPosPrev) > tHeight) {
            scrollTimeout = $timeout(updateMediaView, 0);
            scrollPosPrev = scrollPos;
        }
        updateTs = utilsSvc.now();
        $scope.scrollToTop = scrollPos > wHeight;
    };

    $scope.setCategory = function(category) {
        $rootScope.category = category;
        $scope.loadGrid();
    };

    $scope.setSort = function(sort) {
        $rootScope.sort = sort;
        $scope.loadGrid();
    };

    $scope.clearFilter = function() {
        eventSvc.emit('clearFilter');
        $scope.loadGrid();
    };

    $scope.clearSelect = function() {
        for (var i = 0; i < listCache.length; i++) {
            if (listCache[i].selected) {
                delete listCache[i].selected;
            }
        }
        $scope.listSelect = [];
    };

    $scope.updateSelect = function() {
        $scope.listSelect = [];
        for (var i = 0; i < listCache.length; i++) {
            if (listCache[i].selected) {
                $scope.listSelect.push(listCache[i]);
            }
        }
    };

    //
    // Events
    //
    $rootScope.$on('loadMediaGrid', function() {
        $scope.loadGrid();
    });

    $rootScope.$on('updateMediaCache', function(event, flush) {
        updateMediaCache(true, flush);
    });

    $rootScope.$on('updateMediaSelect', function() {
        $scope.updateSelect();
    });

    $rootScope.$on('clearMediaSelect', function() {
        $scope.clearSelect();
    });

    $rootScope.$on('playerStart', function(event, data) {
        if (data.index < listCache.length) {
            mediaIndex = data.index;
        }
        var id = data.media.video_id
        if (id && utilsSvc.getIndex(id, mediaPlayed) == -1) {
            mediaPlayed.push(id);
        }
    });

    $rootScope.$on('playerNextMedia', function(event) {
        for (var i = mediaIndex + 1; i < listCache.length; i++) {
            if (listCache[i].video_id && utilsSvc.getIndex(listCache[i].video_id, mediaPlayed) == -1) {
                eventSvc.emit('playerStart', {index: i, media: listCache[i]});
                return true;
            }
        }
    });

    $scope.$on('$destroy', function() {
        active = false;
    });

    $scope.loadGrid();

}


//
// Media modals
//
function MediaModalCtrl($rootScope, $scope, mediaSvc, eventSvc, utilsSvc) {

    $scope.filter = '';

    function setUserPath() {
        if ($scope.user && $scope.media) {
            $scope.userPath = $scope.user.paths[$scope.media.category];
        }
    }

    function setMediaInfo() {
        if ($scope.media) {
            if (utilsSvc.getIndex($scope.media.category, ['tv', 'anime']) != -1) {
                $scope.modes = $rootScope.modesTv;
            } else {
                $scope.modes = $rootScope.modes;
            }
            if (!$scope.media.langs) {
                if ($scope.media.obj) {
                    $scope.media.langs = $scope.media.obj.langs;
                } else {
                    $scope.media.langs = [];
                }
            }
            $scope.media.mode = $scope.modes[0];
            $scope.media.recurrence = $rootScope.similarRecurrence;
        }
    };

    //
    // Actions
    //
    $scope.addSearch = function() {
        mediaSvc.createMedia($scope.media).
            success(function(data) {
                if (data.error) {
                    console.error('failed to add search:', data.error);
                }
            });
    };

    $scope.addSimilar = function() {
        mediaSvc.createSimilar($scope.media).
            success(function(data) {
                if (data.error) {
                    console.error('failed to add similar:', data.error);
                }
            });
    };

    $scope.updateSearch = function() {
        mediaSvc.updateSearch($scope.media.obj).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update search:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.updateSimilar = function() {
        mediaSvc.updateSimilar($scope.media.obj).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update similar:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.resetSearch = function() {
        mediaSvc.resetSearch($scope.media.id).
            success(function(data) {
                if (data.error) {
                    console.error('failed to reset search:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.shareMedia = function() {
        mediaSvc.shareMedia($scope.media.id, $scope.user.id, $scope.userPath).
            success(function(data) {
                if (data.error) {
                    console.error('failed to share media:', data.error);
                }
            });
    };

    $scope.removeMedia = function() {
        mediaSvc.removeMedia($scope.media.id, $scope.media.type).
            success(function(data) {
                if (data.error) {
                    console.error('failed to remove media:', data.error);
                } else {
                    eventSvc.emit('updateMediaCache');
                }
            });
    };

    $scope.removeMediaMulti = function() {
        var ids = [];
        for (var i = 0; i < $scope.listSelect.length; i++) {
            ids.push($scope.listSelect[i].id);
        }
        mediaSvc.removeMedia(ids, $scope.type.value).
            success(function(data) {
                if (data.error) {
                    console.error('failed to remove media:', data.error);
                } else {
                    eventSvc.emit('clearMediaSelect');
                    eventSvc.emit('updateMediaCache', true);
                }
            });
    };

    $scope.setFilter = function() {
        $rootScope.query = $scope.filter;
        eventSvc.emit('loadMediaGrid');
    };

    //
    // Events
    //
    $rootScope.$on('mediaModalOpen', function(event, media) {
        $scope.media = angular.copy(media);
        setMediaInfo();
        setUserPath();
    });

    $rootScope.$on('clearFilter', function() {
        $scope.filter = '';
        $rootScope.query = '';
    });

    $scope.$watch('user', setUserPath);

}


//
// Sync list
//
function SyncListCtrl($rootScope, $scope, $timeout, syncSvc, utilsSvc) {

    $scope.syncs = [];
    $scope.sync;

    $scope.statusClasses = {
        ok: 'label-success',
        error: 'label-error',
    };

    var active = true;
    var cacheDelta = 10000;
    var updateTimeout;

    function updateSyncs(force) {
        $timeout.cancel(updateTimeout);
        if (!active) {
            return false;
        }
        if (!utilsSvc.focus && !force) {
            updateTimeout = $timeout(updateSyncs, cacheDelta);
        } else {
            syncSvc.listSyncs().
                error(function() {
                    updateTimeout = $timeout(updateSyncs, cacheDelta);
                }).
                success(function(data) {
                    utilsSvc.updateList($scope.syncs, data.result);
                    updateTimeout = $timeout(updateSyncs, cacheDelta);
                });
        }
    }

    //
    // Events
    //
    $rootScope.$on('updateSyncs', function() {
        updateSyncs(true);
    });

    $scope.$on('$destroy', function() {
        active = false;
    });

    updateSyncs();

}


//
// Sync modals
//
function SyncModalCtrl($rootScope, $scope, syncSvc, eventSvc, utilsSvc) {

    function setSyncUser() {
        if ($scope.sync && $scope.user) {
            $scope.sync.user = $scope.user.id;
        }
    }

    $scope.updateSync = function() {
        utilsSvc.formatPrimitives($scope.sync,
                ['genre_incl', 'genre_excl']);

        syncSvc.updateSync($scope.sync).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update sync:', data.error);
                } else {
                    eventSvc.emit('updateSyncs');
                }
            });
    };

    $scope.resetSync = function() {
        syncSvc.resetSync($scope.sync._id).
            success(function(data) {
                if (data.error) {
                    console.error('failed to reset sync:', data.error);
                } else {
                    eventSvc.emit('updateSyncs');
                }
            });
    };

    $scope.removeSync = function() {
        syncSvc.removeSync($scope.sync._id).
            success(function(data) {
                if (data.error) {
                    console.error('failed to remove sync:', data.error);
                } else {
                    eventSvc.emit('updateSyncs');
                }
            });
    };

    //
    // Events
    //
    $rootScope.$on('syncModalOpen', function(event, sync) {
        $scope.sync = angular.copy(sync);
        for (var i = 0; i < $rootScope.users.length; i++) {
            if ($rootScope.users[i].id == $scope.sync.user) {
                $scope.user = $rootScope.users[i];
            }
        }
        utilsSvc.formatPrimitives($scope.sync,
                ['genre_incl', 'genre_excl'], true);
    });

    $scope.$watch('user', setSyncUser);

}


//
// Settings list
//
function SettingsListCtrl($rootScope, $scope, apiSvc, settingsSvc, eventSvc, utilsSvc) {

    $scope.apiUrl = apiSvc.getUrl();
    $scope.settings = {};
    $scope.section = null;

    function getSettings() {
        $scope.settings = {};
        settingsSvc.listSettings().success(function(data) {
            $scope.settings = data.result;
            utilsSvc.formatPrimitives($scope.settings,
                    ['include', 'exclude', 'media_root_exclude'], true);
        });
    }

    //
    // Actions
    //
    function checkApi() {
        apiSvc.checkStatus().
            error(function() {
                $scope.apiStatus = false;
            }).
            success(function(data) {
                $scope.apiStatus = true;
                getSettings();
            });
    }

    $scope.updateApiUrl = function() {
        apiSvc.setUrl($scope.apiUrl);
        checkApi();
    };

    $scope.updateSettings = function() {
        utilsSvc.formatPrimitives($scope.settings,
                ['include', 'exclude', 'media_root_exclude']);

        settingsSvc.updateSettings($scope.settings).
            success(function(data) {
                if (data.error) {
                    console.error('failed to update settings:', data.error);
                }
                getSettings();
            });
    };

    $scope.getFilterName = function(type, filter) {
        switch (filter) {
            case 'include':
                return type + ' inclusions';
                break;
            case 'exclude':
                return type + ' exclusions';
                break;
            case 'include_raw':
                return type + ' inclusion regex';
                break;
            case 'exclude_raw':
                return type + ' exclusion regex';
                break;
            case 'size_min':
                return 'minimum ' + type + ' size';
                break;
            case 'size_max':
                return 'maximum ' + type + ' size';
                break;
        }
    };

    checkApi();

}
