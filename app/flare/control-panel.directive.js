/**
* Created by gjrwcs on 9/15/2016.
*/
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.flare').directive('controlPanel', [
    'Flare',
    'flare.const.Effects',
    MDT.Scheduler,
    'media.Library',
    'audio.Player',
    'media.const.Type',
    controlPanel]);

function controlPanel(Visualizer, Effects, MScheduler, MediaLibrary, AudioPlayer, MediaType) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'views/control-panel.html',
        link(scope) {
            scope.reverbEffects = [];
            scope.player = AudioPlayer;
            scope.visualizer = Visualizer;
            scope.effects = Effects;

            const noneOption = {name: 'None', id: 9999};
            scope.reverbEffect = noneOption;
            // Get all of the reverb effects from the media library
            MediaLibrary.getAudioClips(MediaType.ReverbImpulse)
                .then((effects) => {
                    scope.reverbEffects = effects.asArray();
                    scope.reverbEffects.push(noneOption);
                });

            /**
             * Enables the currently selected reverb effect
             */
            scope.setReverbEffect = () => {
                if (scope.reverbEffect.name === 'None') {
                    AudioPlayer.disableConvolverNode();
                } else {
                    const clipData = MediaLibrary.getAudioClip(scope.reverbEffect.name).clip;
                    AudioPlayer.setConvolverImpulse(clipData);
                }
            };

            MScheduler.schedule(() => scope.$apply());
        },
        controller: 'ControlPanelCtrl',
    };
}
