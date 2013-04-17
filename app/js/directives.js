'use strict';

(function() {

    var playerScreenFactor = .8;
    var playerAspectRatio = 16 / 9;

    var directives = angular.module('mediaDirectives', []);

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

    directives.directive('whenScrolled', function() {
        return function(scope, element, attrs) {
            $(window).scroll(function() {
                scope.$eval(attrs.whenScrolled);
            });
            scope.$on('$destroy', function() {
                $(window).unbind('scroll');
            });
        };
    });

    directives.directive('resizeAction', function() {
        return function(scope, element, attrs) {
            $(window).resize(function() {
                setPlayerSize();
                scope.$eval(attrs.resizeAction);
                if (!scope.$$phase) scope.$apply();
            });
            scope.$on('$destroy', function() {
                $(window).unbind('resize');
            });
        };
    });

    directives.directive('openAddModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    eventSvc.emit('addModalOpen');
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openAddModal).modal('show');
                }
            });
        };
    });

    directives.directive('openMediaModal', function(eventSvc) {
        return function(scope, element, attrs) {
            element.click(function() {
                if (!element.hasClass('disabled')) {
                    eventSvc.emit('mediaModalOpen', scope.media);
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
                    eventSvc.emit('syncModalOpen', scope.sync);
                    if (!scope.$$phase) scope.$apply();
                    $(attrs.openSyncModal).modal('show');
                }
            });
        };
    });

    directives.directive('modalFocus', function() {
        return function(scope, element, attrs) {
            element.on('shown', function() {
                $(attrs.modalFocus).focus();
            });
        };
    });

    directives.directive('submitModal', function() {
        return function(scope, element, attrs) {
            var modal = element.parents('.modal');

            element.click(function() {
                scope.$eval(attrs.submitModal);
                modal.modal('hide');
            });

            modal.
                on('shown', function() {
                    modal.keyup(function(e) {
                        if (e.keyCode == 13) {
                            var form = scope[modal.find('form').attr('name')];
                            if (!form.$invalid) {
                                scope.$eval(attrs.submitModal);
                                modal.modal('hide');
                            }
                        }
                    })
                }).
                on('hidden', function() {
                    modal.unbind('keyup');
                });
        };
    });

    directives.directive('clickNoDefault', function() {
        return function(scope, element, attrs) {
            element.click(function(event) {
                scope.$eval(attrs.clickNoDefault);
                event.preventDefault();
                event.stopPropagation();
                if (!scope.$$phase) scope.$apply();
            });
        };
    });

    directives.directive('scrollToTop', function() {
        return function(scope, element, attrs) {
            element.click(function() {
                $('html, body').animate({scrollTop: 0}, 500);
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
            if (url) {
                element.css('background-image', 'url("' + url + '")');
            }
            element.click(function() {
                eventSvc.emit('playerStart', {index: scope.$index, media: scope.media});
                if (!scope.$$phase) scope.$apply();

                if (scope.media.video_id) {
                    $('#player').show();
                } else {
                    if (url) {
                        $('#media-overlay').css('background-image', 'url("' + url + '")');
                    } else {
                        $('#media-overlay').css('background-image', 'none');
                    }
                    $('#player').hide();
                }

                showMediaInfo();
                setPlayerSize();
                $('body').css('overflow', 'hidden');
                $('#modal-player').modal('show');
            });
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

    directives.directive('youtubeApi', function() {
        return function(scope, element, attrs) {
            var tag = document.createElement('script');
            tag.src = '//www.youtube.com/iframe_api';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        };
    });


    function setPlayerSize() {
        var sWidth = $(window).width();
        var sHeight = $(window).height();
        var widthLimit = Math.floor(sWidth * playerScreenFactor);
        var heightLimit = Math.floor(sHeight * playerScreenFactor);

        var width = Math.floor(heightLimit * playerAspectRatio);
        var height = heightLimit;
        if (width > widthLimit) {
            height = Math.floor(widthLimit / playerAspectRatio);
            width = widthLimit;
        }
        var offsetX = Math.floor((sWidth - width) / 2);
        var offsetY = Math.floor((sHeight - height) / 2);
        $('#modal-player').css({left: offsetX, top: offsetY, width: width, height: height});
    }

    function showMediaInfo() {
        $('#media-info').css('width', '33%');
        $('#media-overlay').css('width', '67%');
    }

    function hideMediaInfo() {
        $('#media-overlay').css('width', '100%');
        $('#media-info').css('width', '0%');
    }

})();
