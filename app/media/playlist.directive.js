/**
* Created by Greg on 9/18/2016.
*/
require('angular').module('pulsar.media').directive('playlist', [
    'audio.Player',
    playlistDirective]);

function playlistDirective(AudioPlayer) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            actionOverride: '=',
            playlist: '=',
        },
        templateUrl: 'views/playlist.html',
        link(scope) {
            scope.page = 0;
            scope.clipList = [];

            scope.playlist.addEventListener('itemsSet', () => {
                scope.page = 0;
                scope.getPage(scope.page, scope.clipList);
            });

            scope.playlist.addEventListener('itemAdded', () => scope.getPage(scope.page, scope.clipList));

            // By default send a played clip to the audio player
            scope.playClip = (clip) => {
                AudioPlayer.playClip(clip);
            };

            // Allow for clients to set an alternative action
            if (scope.actionOverride instanceof Function) {
                scope.playClip = scope.actionOverride;
            }

            /**
             * Gets a subset of results from a clip queue
             * @param {number} page
             * @param {Array} clipList
             * @returns {void}
             */
            scope.getPage = (page, clipList) => {
                if (scope.playlist === null) {
                    return;
                }

                scope.playlist.getPage(page, clipList);
            };

            scope.getPage(0, scope.clipList);

            scope.isPlaying = clipId => (typeof clipId === 'number' && (AudioPlayer.playing || {}).id === clipId);
        },
    };
}
