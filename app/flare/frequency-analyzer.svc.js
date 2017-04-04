/**
 * Created by gjr8050 on 10/19/2016.
 */
'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
(()=>{
    /**
     * Performs analysis on frequency data each frame to generate metrics
     */
    require('angular').module('pulsar.flare').service('flare.FrequencyAnalyzer', [
        MDT.Scheduler,
        'audio.RealtimeData',
        'audio.const.FrequencyRanges',
        'audio.const.MaxFrequency',
        'audio.Player',
        FrequencyAnalyzer]);

    function FrequencyAnalyzer(MScheduler, AudioData, FrequencyRanges, MaxFrequency, AudioPlayer) {
        var results = {
            avgLoudness: 0,
            //keep track of how many indices in the data array actually have values
            //This prevents a large slice of the visualizer from being empty early in the song or for songs that smaller range of data
            dataLimit: 0,
            maxRangeIndices: [],
            maxRangeLoudness: new Uint8Array(FrequencyRanges.length)
        };

        /**
         * Generate metrics from the given set of frequency data
         * @param frequencies array of frequency byte data
         * @param outResults object to output on
         */
        function analyzerFrequencyData(frequencies, outResults) {
            var loudness = 0,
                frequency = 0,
                dataLimit = outResults.dataLimit,
                currentRangeIndex = 0,
                maxRangeLoudness = outResults.maxRangeLoudness,
                maxRangeIndices = outResults.maxRangeIndices,
                frequencyInterval = MaxFrequency / frequencies.length,
                avgLoudness = 0;

            maxRangeLoudness.fill(0);

            for (var i = 0, len = frequencies.length; i < len; i++) {
                loudness = frequencies[i];
                if (loudness > 0) {
                    if (i > dataLimit) {
                        dataLimit = i;
                    }

                    frequency = frequencyInterval * i;

                    //Check we've moved to the next frequency range
                    if (frequency > FrequencyRanges[currentRangeIndex]) {
                        currentRangeIndex++;
                    }

                    //Check if this channel is the loudest in it's range
                    if (loudness > maxRangeLoudness[currentRangeIndex]) {
                        maxRangeLoudness[currentRangeIndex] = loudness;
                        maxRangeIndices[currentRangeIndex] = i;
                    }

                    //Add to the average loudness
                    avgLoudness += loudness / len;
                }
            }

            outResults.dataLimit = dataLimit - (dataLimit % 2);
            outResults.avgLoudness = avgLoudness * 1.1;
            outResults.maxRangeLoudness = maxRangeLoudness;
        }

        MScheduler.schedule(()=> {
            analyzerFrequencyData(AudioData.getFrequencies(), results);
        });

        AudioPlayer.addEventListener('play', ()=> {
            results.dataLimit = 0;
        });

        return {
            getMetrics(){
                return results;
            }
        };
    }
})();
