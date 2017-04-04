/**
 * Created by gjr8050 on 9/16/2016.
 */
'use strict';
require('angular').module('pulsar.flare').directive('audioPlayer', [function(){
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/audio-player.html',
        scope: {
            player: '=',
            queue: '='
        },
        link: function(scope, elem){
            scope.marqueeClipTitle = false;

            scope.getPlaybarSize = function(){
                return scope.player.completionPct * 100 + '%';
            };
            
            scope.seekForward = function(){
                scope.player.playClip(scope.queue.getNext());
            };
            
            scope.seekBack = function(){
                if(scope.player.state !== 'Streaming'){
                    scope.player.playClip(scope.player.playing);
                }
            };
            
            function getMouse(e){
                var mouse = {}; // make an object
                mouse.x = e.pageX - e.target.offsetLeft;
                mouse.y = e.pageY - e.target.offsetTop;
                return mouse;
            }
            
            scope.setGain = function(e){
                var mouse = getMouse(e),
                    playBar = elem[0].querySelector('.play-bar'),
                    pctPos = mouse.x / playBar.clientWidth;
                scope.player.seekTo(pctPos);
            };

            var clipTitle = elem[0].querySelector('.clip-title'),
                clipTitleText = elem[0].querySelector('.clip-title span');
            scope.$watch('player.playing.name', (o, n) =>{
                scope.marqueeClipTitle = clipTitleText.clientWidth > clipTitle.clientWidth;
            });
        }
    };
}]);