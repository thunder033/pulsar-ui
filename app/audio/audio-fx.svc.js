/**
 * Created by gjr8050 on 11/11/2016.
 */
'use strict';
require('angular').module('pulsar.audio').factory('audio.AudioFx', ['media.Library', 'audio.DataUtils', function (MediaLibrary, AudioData) {

    /* jshint -W056 */
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
        autoId = 0,
        masterGain = audioCtx.createGain();

    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);

    /**
     * @param {Object} params
     * @param {string} params.clipId
     * @param {number} [params.gain=1]
     * @constructor
     */
    function Effect(params){
        if(!params.clipId){
            throw new Error('No AudioClip ID was provided to generate effect');
        }

        this.ready = MediaLibrary.isReady().then(()=>{
            this.clip = MediaLibrary.getAudioClip(params.clipId);
            this.gain = audioCtx.createGain();
            this.gain.connect(masterGain);
            this.gain.gain.value = typeof params.gain === 'number' ? params.gain : 1;

            if(!this.clip.buffer){
                return AudioData.getAudioBuffer(this.clip)
                    .then(buffer => {
                        this.clip.buffer = buffer;
                        return this;
                    });
            }

            return this;
        });


        this.instances = {};
    }

    Effect.prototype.isReady = function(){
        return this.ready;
    };

    Effect.prototype.playInstance = function() {
        return this.isReady()
            .then(()=>{
                var source = audioCtx.createBufferSource();
                source.connect(this.gain);
                source.buffer = this.clip.buffer;
                source.start(0);
                this.instances[autoId++] = source;
                source.onended = () => delete source[autoId];
                return source;
            });
    };

    Effect.prototype.stopAll = function() {
        Object.keys(this.instances).forEach(id => {
            this.instances[id].stop(0);
        });

        this.instances = {};
    };

    return {
        Effect: Effect
    };
}]);