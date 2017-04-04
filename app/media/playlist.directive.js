/**
 * Created by Greg on 9/18/2016.
 */
(()=>{
    'use strict';
    
    angular.module('pulsar.media').directive('playlist', [
        'audio.Player',
        'media.Library',
        'media.const.Type',
        'media.Playlist',
        playlistDirective]);

    function playlistDirective(AudioPlayer, MediaLibrary, MediaType, Playlist){
        return {
            restrict: 'E',
            replace: true,
            scope: {
                actionOverride: '=',
                playlist: '='
            },
            templateUrl: 'views/playlist.html',
            link: function(scope){
                scope.page = 0;
                scope.clipList = [];

                scope.playlist.addEventListener('itemsSet', ()=> {
                    scope.page = 0;
                    scope.getPage(scope.page, scope.clipList);
                });

                scope.playlist.addEventListener('itemAdded', ()=> scope.getPage(scope.page, scope.clipList));

                // By default send a played clip to the audio player
                scope.playClip = function(clip) {
                    AudioPlayer.playClip(clip);
                };

                // Allow for clients to set an alternative action
                if(scope.actionOverride instanceof Function){
                    scope.playClip = scope.actionOverride;
                }

                /**
                 * Gets a subset of results from a clip queue
                 * @param {number} page
                 * @param {Array} clipList
                 * @returns {void}
                 */
                scope.getPage = function(page, clipList) {
                    if(scope.playlist === null){
                        return;
                    }

                    scope.playlist.getPage(page, clipList);
                };

                scope.getPage(0, scope.clipList);

                scope.isPlaying = function(clipId) {
                    return typeof clipId === 'number' && (AudioPlayer.playing || {}).id === clipId;
                };
            }
        };
    }
})();
