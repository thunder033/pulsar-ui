/**
 * Created by gjr8050 on 10/19/2016.
 */
'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
(()=>{
    /**
     * Provides access to audio data and processing utilities
     */
    require('angular').module('pulsar.audio').service('audio.RealtimeData', [
        MDT.Scheduler,
        MDT.const.SampleCount,
        'audio.Player',
        '$q',
        RealtimeData]);

    function RealtimeData(MScheduler, SampleCount, AudioPlayer) {

        var waveformData = new Uint8Array(SampleCount / 2),
            frequencyData = new Uint8Array(SampleCount / 2);

        MScheduler.schedule(()=> {
            var analyzerNode = AudioPlayer.getAnalyzerNode();

            if (!analyzerNode) {
                return;
            }

            analyzerNode.getByteFrequencyData(frequencyData);
            analyzerNode.getByteTimeDomainData(waveformData);
        }, 50);

        this.getWaveform = () => {
            return waveformData;
        };

        this.getFrequencies = () => {
            return frequencyData;
        };
    }
})();
