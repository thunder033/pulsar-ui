/**
* Created by gjr8050 on 9/16/2016.
*/


const EventTarget = require('eventtarget');
const MDT = require('../mallet/mallet.dependency-tree').MDT;

require('angular').module('pulsar.audio').service('audio.Player', [
    MDT.const.SampleCount,
    '$timeout',
    'media.AudioClip',
    Player]);

/**
 *
 * @constructor
 * @extends EventTarget
 */
function Player(SampleCount, $timeout, AudioClip) {
    EventTarget.call(this);

    const states = Object.freeze({
        Loading: 'Loading',
        Playing: 'Playing',
        Streaming: 'Streaming',
        Paused: 'Paused',
        Stopped: 'Stopped',
        Error: 'Error',
    });

    const self = this;
    /**
     * currently playing clip
     * @type {IPlayable}
     */
    let playing = null;
    let sourceNode = null; // active source node (different for each track)
    let audioCtx = null; // the audio context
    let analyzerNode = null;
    let convolverNode = null; // Produces reverb effects
    let gainNode = null; // Master Gain node (affects visualization)
    let outputGainNode = null; // Output gain (affects only volume)
    let userStream = null;
    let playableStream = null;
    let cachedOutputGain = 0;
    let state = states.Loading;
    let trackLength = 0;
    let pausedAt = 0;
    let trackStart = 0;


    function getNow() {
        return ~~window.performance.now();
        // return (new Date()).getTime();
    }

    function getPlaybackTime() {
        switch (state) {
            case states.Paused:
                return pausedAt;
            case states.Playing:
                return (getNow() - trackStart) / 1000;
            default:
                return 0;
        }
    }

    Object.defineProperties(this, {
        states: {get: () => states},
        state: {get: () => state},
        playing: {get: () => playing},
        context: {get: () => audioCtx},
        trackLength: {get: () => trackLength},
        playbackTime: {get: () => getPlaybackTime()},
        completionPct: {get: () => getPlaybackTime() / trackLength},
    });


    this.init = () => {
        self.createAudioContext();
        outputGainNode = self.createOutputGainNode(audioCtx);
        analyzerNode = self.createAnalyzerNode(audioCtx);
        gainNode = self.createMasterGainNode(audioCtx);
        convolverNode = self.createConvolverNode(audioCtx);

        this.addEventListener('ended', () => { this.stop(); });

        playableStream = new AudioClip({
            name: 'Local Audio',
            duration: NaN,
            source: null,
            type: 'Stream',
            artist: '--',
        });
    };

    /**
     * Pause playback if the player is playing
     */
    this.pause = () => {
        if (state === states.Playing) {
            sourceNode.onended = null;
            gainNode.gain.exponentialRampToValueAtTime(0.00000001, audioCtx.currentTime + 0.5);
            pausedAt = self.playbackTime;
            state = states.Paused;
        }
    };

    /**
     * Resume playback if the player is currently paused
     */
    this.resume = () => {
        if (state === states.Paused) {
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            self.playBuffer(sourceNode.buffer, pausedAt).then(() => {
                trackStart = getNow() - pausedAt * 1000;
            });
        }
    };

    /**
     * If the player is playing
     */
    this.togglePlaying = () => {
        if (state === states.Playing) {
            self.pause();
        }        else {
            self.resume();
        }
    };

    this.setOutputGain = (volume) => {
        outputGainNode.gain.value = volume;
    };

    /**
     * play the clip with the given ID
     * @param {IPlayable} clip
     * @param {number} [startTime=0]
     */
    this.playClip = (clip, startTime) => {
        if (!clip) {
            return null;
        }

        return self.stop().then(() => {
            playing = clip;
            state = states.Loading;

            return playing.getBuffer().then((buffer) => {
                self.playBuffer(buffer, startTime || 0);
            }, () => {
                self.stop();
                $timeout(() => {
                    this.dispatchEvent(new Event('ended'));
                }, 200);
            });
        });
    };

    this.playStream = stream => self.stop().then(() => {
            sourceNode = audioCtx.createMediaStreamSource(stream);
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            gainNode.gain.value = 1;
            sourceNode.connect(gainNode);
            state = states.Streaming;
            sourceNode.onended = () => this.dispatchEvent(new Event('ended'));
            this.dispatchEvent(new Event('play'));
            trackStart = getNow();
            trackLength = 0;
        });

    this.playUserStream = deviceId => navigator.mediaDevices.getUserMedia({
        audio: deviceId ? {deviceId} : true,
    }).then((stream) => {
        userStream = stream;
        this.playStream(userStream);
        cachedOutputGain = outputGainNode.gain.value;
        outputGainNode.gain.value = 0;
        playing = playableStream;
    });

    /**
     * Player the audio buffer from the given time (in microseconds) or from the start
     * @param {AudioBuffer} buffer
     * @param {number} [startTime=0]
     */
    this.playBuffer = (buffer, startTime) => self.stop().then(() => {
            self.createAudioSource();
            sourceNode.buffer = buffer;
            gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
            gainNode.gain.value = 1;
            sourceNode.start(0, startTime || 0);
            state = states.Playing;
            sourceNode.onended = () => this.dispatchEvent(new Event('ended'));
            this.dispatchEvent(new Event('play'));
            trackStart = getNow();
            trackLength = buffer.duration;
        });

    /**
     * Seek to a position in the song
     * @param {number} [pct=0] song position from 0 to 1
     */
    this.seekTo = (pct) => {
        const time = trackLength * (pct || 0);
        self.seekToTime(time);
    };

    this.seekToTime = (time) => {
        if (playing && state !== states.Streaming) {
            self.playBuffer(sourceNode.buffer, time).then(() => {
                trackStart = getNow() - time * 1000;
            });
        }
    };

    /**
     * Stop playblack and reset player values
     */
    this.stop = () => {
        gainNode.gain.value = 0;
        // We have to wait a digest cycle for the audio gain to 'take affect'
        // Immediately stopping the source "freezes" the values returned from analyzer node
        return $timeout(() => {
            if (sourceNode) {
                sourceNode.onended = null;
                if (state === states.Playing || state === states.Paused) {
                    sourceNode.stop(0);
                }                else if (state === states.Streaming) {
                    sourceNode.disconnect();
                    outputGainNode.gain.value = cachedOutputGain;
                    userStream = null;
                }
            }

            // clear the old source
            self.createAudioSource();

            trackLength = 0;
            pausedAt = 0;
            trackStart = 0;
            state = states.Stopped;
        });
    };

    /**
     * Retrieve, and create if necessary, an analyzer node
     * @returns {*}
     */
    this.getAnalyzerNode = () => analyzerNode;

    /**
     * Set the active impulse clip on the convolver node
     * @param impulseData
     */
    this.setConvolverImpulse = (impulseData) => {
        const convolver = self.getConvolverNode();

        audioCtx.decodeAudioData(impulseData, (buffer) => {
            convolver.buffer = buffer;
            convolver.loop = true;
            convolver.normalize = true;
            convolver.connect(audioCtx.destination);
        });
    };

    /**
     * Turn off the convolver node
     */
    this.disableConvolverNode = () => {
        if (convolverNode) {
            convolverNode.disconnect();
        }
    };

    /**
     * Retrieve, and create if necessary, the convolver node
     * @returns {*}
     */
    this.getConvolverNode = () => convolverNode;

    this.getGainNode = () => gainNode;

    this.createAudioSource = () => {
        sourceNode = audioCtx.createBufferSource();
        sourceNode.connect(gainNode);
    };

    /**
     * Create an audio context and source node in the service
     */
    this.createAudioContext = () => {
        // create new AudioContext
        // The || is because WebAudio has not been standardized across browsers yet
        // http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
        /* jshint -W056 */
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    };

    /**
     * Create a convolver node in the service
     * @returns {ConvolverNode}
     */
    this.createConvolverNode = (ctx) => {
        const convolver = ctx.createConvolver();
        (analyzerNode).connect(convolver);
        return convolver;
    };

    /**
     * Create an analyzer node
     * @returns {AnalyserNode|*}
     */
    this.createAnalyzerNode = (ctx) => {
        // create an analyser node
        const analyserNode = ctx.createAnalyser();

        /*
         We will request NUM_SAMPLES number of samples or "bins" spaced equally
         across the sound spectrum.

         If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz,
         the third is 344Hz. Each bin contains a number between 0-255 representing
         the amplitude of that frequency.
         */

        // fft stands for Fast Fourier Transform
        analyserNode.fftSize = SampleCount;

        // here we connect to the destination i.e. speakers
        analyserNode.connect(outputGainNode);
        return analyserNode;
    };

    this.createMasterGainNode = (ctx) => {
        const masterGain = ctx.createGain();
        masterGain.connect(analyzerNode);

        return masterGain;
    };

    this.createOutputGainNode = (ctx) => {
        const outputGain = ctx.createGain();
        outputGain.connect(audioCtx.destination);

        return outputGain;
    };

    this.init();
}
