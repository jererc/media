'use strict';

(function() {

    var PLAYER_ASPECT_RATIO = 16 / 9;

    var directives = angular.module('mediaDirectives', []);

    directives.directive('whenResized', function() {
        return function(scope, element, attrs) {
            $(window).resize(function() {
                setPlayerSize(scope.playerScreenFactor);
                showMediaInfo();
                scope.$eval(attrs.whenResized);
                if (!scope.$$phase) scope.$apply();
            });
            scope.$on('$destroy', function() {
                $(window).unbind('resize');
            });
        };
    });

    directives.directive('mediaActions', function(utilsSvc) {
        return function(scope, element, attrs) {
            var actions = element.find(attrs.mediaActions);
            if (utilsSvc.mobile) {
                actions.fadeIn(100);
            } else {
                element.hover(function() {
                    actions.stop(true).fadeIn(50);
                }, function() {
                    actions.stop(true).fadeOut(50);
                });
            }
        };
    });

    directives.directive('openMediaModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    eventSvc.emit('openMediaModal', scope.media);
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openMediaModal).modal('show');
                }
            });
        };
    });

    directives.directive('openSyncModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    eventSvc.emit('openSyncModal', scope.sync);
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openSyncModal).modal('show');
                }
            });
        };
    });

    directives.directive('mediaSelect', function(eventSvc, utilsSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (scope.media.selected) {
                    delete scope.media.selected;
                } else {
                    scope.media.selected = true;
                }
                scope.updateSelect();
                if (!scope.$$phase) scope.$apply();
            });
        };
    });

    directives.directive('showPlayer', function(eventSvc) {
        return function(scope, element, attrs) {
            var url = scope.media.url_thumbnail;
            element.css('background-image', !!url ? 'url("' + url + '")' : 'none');
            element.click(function() {
                eventSvc.emit('playerStart', scope.media);
                if (!scope.$$phase) scope.$apply();
                showMediaInfo();
                setPlayerSize(scope.playerScreenFactor);
                $('body').css('overflow', 'hidden');
                $('#modal-player').modal('show');
            });
        };
    });

    directives.directive('playerPrevious', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                eventSvc.emit('playerNextMedia', {inc: -1, media: scope.media});
                if (!scope.$$phase) scope.$apply();
            });
        };
    });

    directives.directive('playerNext', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                eventSvc.emit('playerNextMedia', {inc: 1, media: scope.media});
                if (!scope.$$phase) scope.$apply();
            });

        };
    });

    directives.directive('playerRemove', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                eventSvc.emit('playerRemoveMedia', scope.media);
                if (!scope.$$phase) scope.$apply();
            });
        };
    });

    directives.directive('youtubeApi', function() {
        return function(scope, element, attrs) {
            var tag = document.createElement('script');
            tag.src = '//www.youtube.com/iframe_api';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        };
    });

    directives.directive('playerActions', function(eventSvc) {
        return function(scope, element, attrs) {
            element.hover(showMediaInfo, hideMediaInfo);
            element.on('hidden', function() {
                eventSvc.emit('playerStop');
                $('body').css('overflow', '');
            });
        };
    });


    function getAspectRatio() {
        if ($(window).width() > $(window).height()) {
            return PLAYER_ASPECT_RATIO;
        } else {
            return 1 / PLAYER_ASPECT_RATIO;
        }
    }

    function setPlayerSize(factor) {
        var sWidth = $(window).width();
        var sHeight = $(window).height();
        var widthLimit = Math.floor(sWidth * factor);
        var heightLimit = Math.floor(sHeight * factor);

        var ratio = getAspectRatio();
        var width = Math.floor(heightLimit * ratio);
        var height = heightLimit;
        if (width > widthLimit) {
            height = Math.floor(widthLimit / ratio);
            width = widthLimit;
        }
        var offsetX = Math.floor((sWidth - width) / 2);
        var offsetY = Math.floor((sHeight - height) / 2);
        $('#modal-player').css({left: offsetX, top: offsetY, width: width, height: height});
    }

    function showMediaInfo() {
        if (getAspectRatio() > 1) {
            $('#media-info').css({'float': 'right', 'width': '33%', 'height': '100%'});
            $('#media-overlay').css({'float': 'left', 'width': '67%', 'height': '100%'});
        } else {
            $('#media-info').css({'float': 'none', 'width': '100%', 'height': '33%'});
            $('#media-overlay').css({'float': 'none', 'width': '100%', 'height': '66%'});
        }
        $('.player-actions').show();
    }

    function hideMediaInfo() {
        $('.player-actions').hide();
        if (getAspectRatio() > 1) {
            $('#media-overlay').css({'float': 'left', 'width': '100%', 'height': '100%'});
            $('#media-info').css({'float': 'right', 'width': '0%', 'height': '100%'});
        } else {
            $('#media-overlay').css({'float': 'none', 'width': '100%', 'height': '100%'});
            $('#media-info').css({'float': 'none', 'width': '100%', 'height': '0%'});
        }
    }

})();
