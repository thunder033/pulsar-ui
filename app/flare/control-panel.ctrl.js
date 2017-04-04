'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.flare').controller('ControlPanelCtrl', [
    '$scope',
    'media.Library',
    'audio.Player',
    'media.PlayQueue',
    '$timeout',
    '$element',
    MDT.Easel,
    ControlPanelCtrl]);

function ControlPanelCtrl($scope, MediaLibrary, AudioPlayer, PlayQueue, $timeout, $element, MEasel){

    MediaLibrary.isReady().then(()=>{
        AudioPlayer.stop();
    });

    $scope.expanded = true;
    $scope.toggleExpanded = () => {
        // This is kind of atrocious, but no time!
        //TODO: replace this mess with broadcast events
        const visualizer = document.querySelector('#visualizer');

        if($scope.expanded) {
            $element.addClass('collapsed');
            $element.removeClass('expanded');

            visualizer.className = 'expanded';
        }
        else {
            $element.addClass('expanded');
            $element.removeClass('collapsed');

            visualizer.className = 'collapsed';
        }

        $scope.expanded = !$scope.expanded;

        //Resize the canvases
        const baseCanvas =  MEasel.context.canvas;
        MEasel.resizeCanvas(baseCanvas, MEasel.context);
        MEasel.createNewCanvas('quarterRender', baseCanvas.width / 2, baseCanvas.height / 2);

    };

    $scope.playQueueAdded = ''; //The title of the last added song
    $scope.notifcationEvent = null; //Handle to the timeout event (hiding the notification)
    
    $scope.player = AudioPlayer;
    $scope.playQueue = new PlayQueue(AudioPlayer);

    $scope.isActiveNotification = function(){
        return $scope.playQueueAdded !== '' && $scope.playQueueAdded !== null;
    };

    $scope.playQueue.addEventListener('itemAdded', e =>{
        if(!e.item){
            return;
        }

        //Get the name of added item
        $scope.playQueueAdded = e.item.getName();

        // cancel out the previous notification hide event
        if($scope.notifcationEvent !== null){
            $timeout.cancel($scope.notifcationEvent);
        }

        //Make the notification disappear after a delay
        $scope.notifcationEvent = $timeout(()=>{
            $scope.playQueueAdded = null;
            $scope.notifcationEvent = null;
        }, 1500);
    });
}
