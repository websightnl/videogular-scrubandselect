/**
 * @license websight v1.0.0 http://websight.nl
 * Eric Bus
 * License: MIT
 */
/**
 * @ngdoc directive
 * @name nl.websight.videogular.plugins.scrubandselect.directive:vgScrubAndSelectBar
 * @restrict E
 * @description
 * This directive acts as a container and you will need other directives to control the media.
 * Inside this directive you can add other directives like vg-play-pause-button and vg-scrub-bar.
 *
 * <pre>
 * <videogular vg-theme="config.theme.url">
 *    <vg-media vg-src="sources"></vg-media>
 *
 *    <vg-controls vg-autohide='config.autohide' vg-autohide-time='config.autohideTime'></vg-controls>
 * </videogular>
 * </pre>
 *
 * @param {boolean=false} vgAutohide Boolean variable or value to activate autohide.
 * @param {number=2000} vgAutohideTime Number variable or value that represents the time in milliseconds that will wait vgControls until it hides.
 *
 *
 */
"use strict";
angular.module("nl.websight.videogular.plugins.scrubandselect", [])
    .run(
    ["$templateCache", function ($templateCache) {
        $templateCache.put("vg-templates/vg-scrub-and-select-bar",
            '<div role="slider" aria-valuemax="{{ariaTime(API.totalTime)}}" aria-valuenow="{{ariaTime(API.currentTime)}}" aria-valuemin="0" aria-label="Time scrub bar" tabindex="0" ng-transclude ng-keydown="onScrubBarKeyDown($event)"></div>');
    }]
)
    .directive("vgScrubAndSelectBar",
    ["VG_STATES", "VG_UTILS", function (VG_STATES, VG_UTILS) {
        return {
            restrict: "E",
            require: "^videogular",
            transclude: true,
            templateUrl: function (elem, attrs) {
                return attrs.vgTemplate || 'vg-templates/vg-scrub-and-select-bar';
            },
            link: function (scope, elem, attr, API) {
                var isSeeking = false;
                var isLooping = false;
                var isDragging = false;
                var isInDrag = false;
                var isPlaying = false;
                var dragStartX = 0;
                var isPlayingWhenSeeking = false;
                var touchStartX = 0;
                var LEFT = 37;
                var RIGHT = 39;
                var SPACE = 32;
                var NUM_PERCENT = 5;

                scope.API = API;
                scope.ariaTime = function (time) {
                    return Math.round(time / 1000);
                };

                scope.onScrubBarTouchStart = function onScrubBarTouchStart($event) {
                    var event = $event.originalEvent || $event;
                    var touches = event.touches;
                    var touchX;

                    if (VG_UTILS.isiOSDevice()) {
                        touchStartX = (touches[0].clientX - event.layerX) * -1;
                    }
                    else {
                        touchStartX = event.layerX;
                    }

                    touchX = touches[0].clientX + touchStartX - touches[0].target.offsetLeft;

                    isSeeking = true;
                    if (isPlaying) isPlayingWhenSeeking = true;
                    API.pause();
                    API.seekTime(touchX * API.mediaElement[0].duration / elem[0].scrollWidth);

                    scope.$apply();
                };

                scope.onScrubBarTouchEnd = function onScrubBarTouchEnd($event) {
                    var event = $event.originalEvent || $event;
                    if (isPlayingWhenSeeking) {
                        isPlayingWhenSeeking = false;
                        API.play();
                    }
                    isSeeking = false;

                    scope.$apply();
                };

                scope.onScrubBarTouchMove = function onScrubBarTouchMove($event) {
                    var event = $event.originalEvent || $event;
                    var touches = event.touches;
                    var touchX;

                    if (isSeeking) {
                        touchX = touches[0].clientX + touchStartX - touches[0].target.offsetLeft;
                        API.seekTime(touchX * API.mediaElement[0].duration / elem[0].scrollWidth);
                    }

                    scope.$apply();
                };

                scope.onScrubBarTouchLeave = function onScrubBarTouchLeave(event) {
                    isSeeking = false;

                    scope.$apply();
                };

                scope.onScrubBarMouseDown = function onScrubBarMouseDown(event) {
                    console.log(event);
                    event = VG_UTILS.fixEventOffset(event);

                    isDragging = true;
                    isInDrag = false;
                    dragStartX = event.offsetX;

                    // Cancel looping
                    if (isLooping)
                    {
                        isLooping = false;
                        API.pause();
                    }

                    scope.$apply();
                };

                scope.onScrubBarMouseUp = function onScrubBarMouseUp(event) {
                    isDragging = isInDrag = false;

                    scope.$apply();
                };

                scope.onScrubBarMouseMove = function onScrubBarMouseMove(event) {
                    if (isInDrag) {
                    }

                    scope.$apply();
                };

                scope.onScrubBarMouseLeave = function onScrubBarMouseLeave(event) {
                    isDragging = isInDrag = false;

                    scope.$apply();
                };

                scope.onScrubBarKeyDown = function onScrubBarKeyDown(event) {
                    var currentPercent = (API.currentTime / API.totalTime) * 100;

                    if (event.which === LEFT || event.keyCode === LEFT) {
                        API.seekTime(currentPercent - NUM_PERCENT, true);
                        event.preventDefault();
                    }
                    else if (event.which === RIGHT || event.keyCode === RIGHT) {
                        API.seekTime(currentPercent + NUM_PERCENT, true);
                        event.preventDefault();
                    }
                    else if (event.which === SPACE || event.keyCode === SPACE) {
                        API.playPause();
                    }
                };

                // Disable normal dragging
                scope.onScrubBarDragStart = function onScrubBarDragStart(event) {
                    event.preventDefault();
                    return false;
                };

                scope.setState = function setState(newState) {
                    if (!isSeeking) {
                        switch (newState) {
                            case VG_STATES.PLAY:
                                isPlaying = true;
                                break;

                            case VG_STATES.PAUSE:
                                isPlaying = false;
                                break;

                            case VG_STATES.STOP:
                                isPlaying = false;
                                break;
                        }
                    }
                };

                scope.$watch(
                    function () {
                        return API.currentState;
                    },
                    function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            scope.setState(newVal);
                        }
                    }
                );

                // Touch move is really buggy in Chrome for Android, maybe we could use mouse move that works ok
                if (VG_UTILS.isMobileDevice()) {
                    elem.bind("touchstart", scope.onScrubBarTouchStart);
                    elem.bind("touchend", scope.onScrubBarTouchEnd);
                    elem.bind("touchmove", scope.onScrubBarTouchMove);
                    elem.bind("touchleave", scope.onScrubBarTouchLeave);
                }
                else {
                    elem.bind("mousedown", scope.onScrubBarMouseDown);
                    elem.bind("mouseup", scope.onScrubBarMouseUp);
                    elem.bind("dragsart", scope.onScrubBarDragStart);
                    elem.bind("mousemove", scope.onScrubBarMouseMove);
                    elem.bind("mouseleave", scope.onScrubBarMouseLeave);
                }
            }
        }
    }]
);
