/**
* Created by Greg on 11/25/2016.
*/
const MDT = require('../mallet/mallet.dependency-tree').MDT;
/**
 * @module audio.DataUtils
 */
require('angular').module('pulsar.audio').service('audio.DataUtils', [
    MDT.const.SampleCount,
    '$q',
    DataUtils]);

/**
 * @param SampleCount
 * @param $q
 * @property getAudioBuffer
 * @property renderFrameBuffers
 * @constructor
 */
function DataUtils(SampleCount, $q) {
    /**
     * Generates an audio buffer for the clip and caches the result on the clip
     * @param {ArrayBuffer} rawBuffer
     * @returns {Promise}
     */
    this.getAudioBuffer = (rawBuffer) => {
        const renderOp = $q.defer();

        /* jshint -W056 */
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        function handleError(e) {
            renderOp.reject(e);
        }

        audioCtx.decodeAudioData(rawBuffer, (buffer) => {
            renderOp.resolve(buffer);
            // Utilize both catch methods for different browsers
        }, handleError).catch(handleError);

        return renderOp.promise.finally(() => {
            audioCtx.close();
        });
    };

    /**
     * Renders discrete samples of the buffer for a given clip using an offline context
     * @param clip
     * @returns {IPromise<Array>|Promise.<Array>|*}
     */
    this.renderFrameBuffers = clip => clip.getBuffer().then((buffer) => {
        // Create an offline context and nodes,
        // were dividing the sample rate by 4 so that things don't crash when add dual channel
        const offlineCtx = new OfflineAudioContext(
            buffer.numberOfChannels,
            buffer.sampleRate * buffer.duration / 4,
            buffer.sampleRate / 4);
        const processor = offlineCtx.createScriptProcessor(
            SampleCount,
            buffer.numberOfChannels,
            buffer.numberOfChannels);
        const sourceNode = offlineCtx.createBufferSource();

            // set nodes up
            sourceNode.connect(processor);
            processor.connect(offlineCtx.destination);

            /*
             As the offline context renders buffers, capture them
             Each of these will contain the raw PCM data for a short duration of the clip
             This would be nice to do in a web worker, but no support :(
             */
            const frameBuffers = [];
            processor.onaudioprocess = (e) => {
                // Were only using the left channel at the moment
                const data = e.inputBuffer.getChannelData(0);
                const copy = new Float32Array(data.length);

                // We have to manually copy the array because any other method crashes the browser
                for (let i = 0; i < data.length; i++) {
                    copy[i] = data[i];
                }

                frameBuffers.push(copy);
            };

            // start rendering the buffer
            sourceNode.buffer = buffer;
            sourceNode.start();
            return offlineCtx.startRendering()
                .then(() => ({
                    frameBuffers,
                    sampleRate: buffer.sampleRate / 4,
                    duration: buffer.duration,
                }));
        });
}
