/**
 * Created by gjr8050 on 11/30/2016.
 */
'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular')
    .module('pulsar.media')
    .directive('playQueue', [
        'media.Playlist',
        MDT.Math,
        playQueueDirective
    ]);

function playQueueDirective(Playlist, MM){
    return {
        restrict: 'E',
        templateUrl: 'views/play-queue.html',
        scope: {
            audioPlayer: '=',
            queue: '='
        },
        link: function(scope){
            /** @type {Array<IPlayable>} */
            scope.page = [];
            scope.pos = 0;
            scope.playing = null;

            var startPos = 0,
                endPos = 0;

            /**
             * In place swap the start/end position pointers
             */
            function swapPositions(){
                endPos = startPos - endPos;
                startPos = startPos - endPos;
                endPos = startPos + endPos;
            }

            scope.isFirstPage = function(){
                return startPos === 0;
            };

            scope.isLastPage = function(){
                return (endPos + 1) >= scope.queue.getItems().length;
            };

            var pageLength = 10;
            scope.seekPage = function (direction) {
                var dir = MM.sign(direction), //guarantee -1, 0, or 1
                    queueSize = scope.queue.getItems().length;

                switch(dir){
                    case -1:
                        // If seeking up the queue, move the position pointer to the start of the current page
                        startPos = Math.max(startPos - 1, 0);
                        endPos = startPos;
                        break;
                    case 0:
                        endPos = startPos;
                        // 0 indicates refreshing the current page, so still move down the list
                        dir = 1;
                        break;
                    case 1:
                        endPos = Math.min(endPos + 1, queueSize);
                        startPos = endPos;
                }

                // Clear the page
                scope.page.length = 0;

                var items = scope.queue.getItems(), // Get the entire queue
                    pageWeight = 0, // combined weight of items currently on the page
                    func = dir > 0 ? 'push' : 'unshift'; // how items will be addded to the page

                while(pageWeight < pageLength && endPos < queueSize && endPos >= 0) {
                    scope.page[func](items[endPos]);
                    pageWeight += (items[endPos] instanceof Playlist) ? 5 : 1;
                    endPos += dir;
                }

                // Cancel out the last position move, so the position pointer is always at the last item on the page
                endPos -= dir;

                if(dir < 0){
                    swapPositions();
                }
            };

            function playNext(){
                scope.playing = scope.queue.getNext();
                if(scope.playing !== null){
                    scope.audioPlayer.playClip(scope.playing);
                }
            }

            scope.queue.addEventListener('itemAdded', ()=>{
                scope.seekPage(0);
                if(scope.audioPlayer.state === scope.audioPlayer.states.Stopped){
                    playNext();
                }
            });

            scope.queue.addEventListener('itemDequeued', ()=>{scope.seekPage(0);});
        }
    };
}