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
    'audio.RealtimeData',
    MDT.Log,
    controlPanel]);

function controlPanel(Visualizer, Effects, MediaLibrary, AudioPlayer, MediaType, AudioData, Log) {
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
            scope.fields = {reverbEffect: noneOption, amplifyFactor: 1};
            scope.setAmplifyFactor = AudioData.setAmplifyFactor;
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
                if (scope.fields.reverbEffect.name === 'None') {
                    Log.info('Disable audio effect');
                    AudioPlayer.disableConvolverNode();
                } else {
                    Log.info(`Set reverb effect to ${scope.fields.reverbEffect.name}`);
                    scope.fields.reverbEffect.getBuffer().then((buffer) => {
                        AudioPlayer.setConvolverImpulse(buffer);
                    }, Log.error);
                }
            };
        },
        controller: 'ControlPanelCtrl',
    };
}
