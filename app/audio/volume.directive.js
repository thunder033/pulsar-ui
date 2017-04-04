'use strict';
/**
 * Created by Greg on 12/4/2016.
 */

require('angular').module('pulsar.audio')
    /**
     * @ngdoc directive
     * @description Volume and Mute controls
     */
    .directive('apVolume', ['$timeout', 'mallet.MouseUtils', apVolumeDirective]);

function apVolumeDirective($timeout, MouseUtils){
    return {
        restrict: 'E',
        replace: true,
        scope: {
            player: '='
        },
        templateUrl: 'views/volume.html',
        controller: ['$scope', '$element', function($scope, $element){
            //Load the cached mute and gain values from localStorage
            var gain = parseFloat(localStorage.getItem('pulsar-volume') || '0.5');
            var cachedMute = parseInt(localStorage.getItem('pulsar-muted') || '0');
            $scope.muted = cachedMute === 1;

            //Apply the mute and gain values to the audio player
            $timeout(()=>  $scope.player.setOutputGain(gain * ($scope.muted ? 0 : 1)));

            /**
             * Toggle the mute setting and save it
             */
            $scope.toggleMute = () => {
                $scope.muted = !$scope.muted;
                localStorage.setItem('pulsar-muted', $scope.muted === true ? '1' : '0');
                $scope.player.setOutputGain($scope.muted ? 0 : gain);
            };

            /**
             * The current gain value from 0 to 1
             * @returns {Number}
             */
            $scope.getGain = function(){
                return gain;
            };

            /**
             * Set the gain based on the mouse position in the volume bar
             * @param {Event} e
             */
            $scope.setGain = function(e){
                //Get the volume bar element
                var volumeBar = $element[0].querySelector('.volume-bar'),
                    //Get the relative mouse coords
                    mouse = MouseUtils.getElementCoords(e, volumeBar);
                gain = mouse.x / volumeBar.clientWidth;
                localStorage.setItem('pulsar-volume', gain);
                //Apply the mute value to the gain set
                $scope.player.setOutputGain(gain * ($scope.muted ? 0 : 1));
            };
        }]
    };
}