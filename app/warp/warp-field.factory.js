/**
 * Created by gjr8050 on 11/11/2016.
 */
(() => {
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    require('angular').module('pulsar.warp').factory('warp.WarpField', [
        MDT.Thread,
        'audio.DataUtils',
        MDT.const.SampleCount,
        'config.Path',
        Field]);

    function Field(Thread, DataUtils, SampleCount, Path) {
        // Create a web worker with the analysis script
        const fieldGenerator = Thread.create(Path.forScript('generateAudioField'));

        /**
         * A WarpField defines a level in Warp, generated from an audio file
         * @constructor
         */
        function WarpField(version = 'v1.41') {
            // Defining a version as a key so that the 'signature' of the object
            // can be compared without analyzing any specific property
            Object.defineProperty(this, version, {configurable: false, value: 1, enumerable: true});
            this.duration = 0;
            this.timeStep = NaN;
            this.level = null;
        }

        /**
         * Performs analysis to generate "audio field" and then begins play
         * @param clip
         * @param [version {string}]
         */
        WarpField.generate = (clip, version) => {
            const warpField = new WarpField(version);
            // This function renders all of the PCM data for the entire clip into series of buffers
            // The result thousands of buckets of 1024 samples (~800 per minute of play w/ current config)
            return DataUtils.renderFrameBuffers(clip)
                .then((result) => {
                    warpField.duration = result.duration;
                    // this is the average duration of time for each buffer created
                    warpField.timeStep = (result.duration / result.frameBuffers.length) * 1000;

                    // Invoke the analysis in a separate thread (using a web worker)
                    return fieldGenerator.invoke({
                        sampleRate: result.sampleRate, // How many samples per second
                        frequencyBinCount: SampleCount, // The number of frequency bins
                        frameBuffers: result.frameBuffers, // The actual array of frame buffers
                    });
                }).then((result) => {
                    warpField.level = result.audioField; // The "level" generated by the async web worker
                    return warpField;
                });
        };

        return WarpField;
    }
})();
