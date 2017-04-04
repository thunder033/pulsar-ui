'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
/**
 * Performs analysis on the waveform data each frame to derive metrics
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.flare').service('flare.WaveformAnalyzer', [
    MDT.Scheduler,
    'audio.RealtimeData',
    MDT.const.SampleCount,
    WaveformAnalazyer]);

function WaveformAnalazyer(MScheduler, AudioData, SampleCount) {
    var results = {};

    /**
     * Calculate the peak, trough, and period of the waveform
     * @param {Array} waveform
     * @param {Object} outResults
     */
    function analyzeWaveform(waveform, outResults) {
        var peakMax = -Number.MAX_VALUE,
            troughMin = Number.MAX_VALUE,
            peakDistance = 0;

        //Find the peak value of the wave and position of the first peak
        var i = 0;
        while (waveform[i] > peakMax) {
            peakMax = waveform[i++];
        }

        //Find the trough and the period
        while (waveform[++i] < peakMax || troughMin >= peakMax) {
            peakDistance++;
            if (waveform[i] < troughMin) {
                troughMin = waveform[i];
            }

            if (i > waveform.length) {
                break;
            }
        }

        //Set the values on the object to maintain object references
        outResults.peak = peakMax;
        outResults.peakDistance = peakDistance;
        outResults.trough = troughMin;
        outResults.amplitude = peakMax - troughMin;
        outResults.period = peakDistance / SampleCount * 2;
    }

    MScheduler.schedule(()=> {
        analyzeWaveform(AudioData.getWaveform(), results);
    }, 75);

    return {
        getMetrics(){
            return results;
        }
    };
}
