/**
* Created by gjr8050 on 10/19/2016.
*/


const MDT = require('../mallet/mallet.dependency-tree').MDT;

/**
 * Provides access to audio data and processing utilities
 */
require('angular').module('pulsar.audio').service('audio.RealtimeData', [
    MDT.Scheduler,
    MDT.const.SampleCount,
    'audio.Player',
    MDT.ng.$q,
    RealtimeData]);

function RealtimeData(MScheduler, SampleCount, AudioPlayer) {
    const waveformData = new Uint8Array(SampleCount / 2);
    const frequencyData = new Uint8Array(SampleCount / 2);
    let amplifyFactor = 1;

    MScheduler.schedule(() => {
        const analyzerNode = AudioPlayer.getAnalyzerNode();

        if (!analyzerNode) {
            return;
        }

        analyzerNode.getByteFrequencyData(frequencyData);
        analyzerNode.getByteTimeDomainData(waveformData);

        for (let i = 0; i < frequencyData.length; i++) {
            frequencyData[i] *= amplifyFactor;
        }
    }, 50);

    this.setAmplifyFactor = (factor) => {
        amplifyFactor = factor;
    };

    this.getWaveform = () => waveformData;

    this.getFrequencies = () => frequencyData;
}
