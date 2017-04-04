/**
 * Created by Greg on 10/29/2016.
 */
'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular')
    .module('pulsar.warp')
    .directive('warpHud', [
        'warp.State',
        MDT.Scheduler,
        'audio.Player',
        'warp.Scoring',
        'warp.LevelLoader',
        '$sce',
        '$timeout',
        'media.Playlist',
        'media.PlayQueue',
        hudDirective
    ]);

function hudDirective(WarpState, MScheduler, AudioPlayer, Scoring, LevelLoader, $sce, $timeout, Playlist, PlayQueue){
    return {
        restrict: 'E',
        templateUrl: 'views/warp-hud.html',
        replace: true,
        controller: ['$scope', function($scope){
            $scope.playQueue = new PlayQueue(AudioPlayer);
            $scope.playlist = new Playlist();

            // We need to intercept the clip from the usual audio player/queue pipeline so it can be loaded into warp
            $scope.playQueue.addEventListener('itemAdded', e => {
                // This should immediately dequeue the added item
                const playable = $scope.playQueue.getNext();
                playable.getBuffer().then(()=>{
                    MScheduler.resume();
                    LevelLoader.playClip(e.item);
                });
            });
        }],
        link: function(scope){
            scope.warpState = WarpState;
            scope.player = AudioPlayer;
            scope.scoring = Scoring;

            scope.toTrusted = function(html){
                return $sce.trustAsHtml(html);
            };

            scope.resume = () => {
                MScheduler.resume();
            };

            scope.toggleMute = () => {
                scope.muted = !scope.muted;
                localStorage.setItem('warp-muted', scope.muted === true ? '1' : '0');
                AudioPlayer.setOutputGain(scope.muted ? 0 : 1);
            };
            var cachedMute = parseInt(localStorage.getItem('warp-muted') || '0');
            scope.muted = cachedMute === 1;

            if(scope.muted){
                $timeout(()=>  AudioPlayer.setOutputGain(0));
            }

        }
    };
}