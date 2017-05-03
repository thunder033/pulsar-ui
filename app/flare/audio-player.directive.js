/**
 * Created by gjr8050 on 9/16/2016.
 */

require('angular').module('pulsar.flare').directive('audioPlayer', [() => ({
        restrict: 'E',
        replace: true,
        templateUrl: 'views/audio-player.html',
        scope: {
            player: '=',
            queue: '=',
        },
        link(scope, elem) {
            scope.marqueeClipTitle = false;

            scope.getPlaybarSize = () => `${scope.player.completionPct * 100}%`;
            
            scope.seekForward = () => {
                scope.player.playClip(scope.queue.getNext());
            };
            
            scope.seekBack = () => {
                if (scope.player.state !== 'Streaming') {
                    scope.player.playClip(scope.player.playing);
                }
            };
            
            function getMouse(e) {
                const mouse = {}; // make an object
                mouse.x = e.pageX - e.target.offsetLeft;
                mouse.y = e.pageY - e.target.offsetTop;
                return mouse;
            }
            
            scope.setGain = (e) => {
                const mouse = getMouse(e);
                const playBar = elem[0].querySelector('.play-bar');
                const pctPos = mouse.x / playBar.clientWidth;
                scope.player.seekTo(pctPos);
            };

            const clipTitle = elem[0].querySelector('.clip-title');
            const clipTitleText = elem[0].querySelector('.clip-title span');
            scope.$watch('player.playing.name', () => {
                scope.marqueeClipTitle = clipTitleText.clientWidth > clipTitle.clientWidth;
            });
        },
    })]);
