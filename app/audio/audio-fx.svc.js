/**
 * Created by gjr8050 on 11/11/2016.
 */
require('angular').module('pulsar.audio').factory('audio.AudioFx', [
    'media.Library',
    'audio.DataUtils',
    '$window',
    effectFactory]);

function effectFactory(MediaLibrary, AudioData, $window) {
    const audioCtx = new ($window.AudioContext || $window.webkitAudioContext)();
    let autoId = 0;
    const masterGain = audioCtx.createGain();

    masterGain.gain.value = 1;
    masterGain.connect(audioCtx.destination);

    class Effect {
        /**
         * @param {Object} params
         * @param {string} params.clipId
         * @param {number} [params.gain=1]
         * @constructor
         */
        constructor(params) {
            if (!params.clipId) {
                throw new Error('No AudioClip ID was provided to generate effect');
            }

            this.ready = MediaLibrary.isReady().then(() => {
                this.clip = MediaLibrary.getAudioClip(params.clipId);
                this.gain = audioCtx.createGain();
                this.gain.connect(masterGain);
                this.gain.gain.value = typeof params.gain === 'number' ? params.gain : 1;

                if (!this.clip.buffer) {
                    return AudioData.getAudioBuffer(this.clip)
                        .then((buffer) => {
                            this.clip.buffer = buffer;
                            return this;
                        });
                }

                return this;
            });


            this.instances = {};
        }

        isReady() {
            return this.ready;
        }

        playInstance() {
            return this.isReady()
                .then(() => {
                    const source = audioCtx.createBufferSource();
                    source.connect(this.gain);
                    source.buffer = this.clip.buffer;
                    source.start(0);
                    this.instances[autoId++] = source;
                    source.onended = () => delete source[autoId];
                    return source;
                });
        }

        stopAll() {
            Object.keys(this.instances).forEach((id) => {
                this.instances[id].stop(0);
            });

            this.instances = {};
        }
    }

    return {Effect};
}
