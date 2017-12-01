/**
* Created by gjrwcs on 9/15/2016.
*/
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.flare').directive('controlPanel', [
    'Flare',
    'flare.const.Effects',
    'media.Library',
    'audio.Player',
    'media.const.Type',
    MDT.Log,
    controlPanel]);

function controlPanel(Visualizer, Effects, MediaLibrary, AudioPlayer, MediaType, Log) {
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
                Log.debug(`Set reverb effect to ${scope.reverbEffect.name}`);
                if (scope.reverbEffect.name === 'None') {
                    AudioPlayer.disableConvolverNode();
                } else {
                    const clipData = MediaLibrary.getAudioClip(scope.reverbEffect.name).clip;
                    AudioPlayer.setConvolverImpulse(clipData);
                }
            };
        },
        controller: 'ControlPanelCtrl',
    };
}
