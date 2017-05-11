/**
 * Created by gjrwcs on 10/25/2016.
 */

// https://github.com/corbanbrook/dsp.js
const dsp = require('../dsp');
const Track = require('game-params').Track;
const Gem = require('game-params').Gem;

/**
 * Gets the index of the largest number in the array
 * @param arr
 * @returns {number}
 */
function getMaxIndex(arr) {
    let max = -Infinity;
    let maxIndex = 0;

    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
            maxIndex = i;
        }
    }

    return maxIndex;
}

/**
 * Generates a pseudo-random number based on the seed
 * @param seed
 * @returns {number}
 */
function random(seed) {
    const x = Math.sin(seed) * 10000;
    return x - ~~(x);
}

/**
 * Generates a gems based off the raw PCM audio data provided
 * @param frameBuffers
 * @param frequencyBinCount
 * @param sampleRate
 * @returns {Array}
 */
function generateAudioField(frameBuffers, frequencyBinCount, sampleRate) {
    const fft = new dsp.FFT(frequencyBinCount, sampleRate);
    // const frequencyRanges = [0, 400, 650, 21050];
    // Each bucket corresponds to a lane, from left to right
    const frequencyBuckets = [
        0, // -> 250
        250, // -> 500
        500, // -> 1750
        1750, // -> 700
        7000, // -> 21050
        21050];
    const lanes = new Array(Track.NUM_LANES);
    const df = 21050 / (frameBuffers[0].length / 2); // delta-frequency between indices after FFT

    // Don't generate a level if frequency buckets are not properly configured
    if (frequencyBuckets.length !== Track.NUM_LANES + 1) {
        throw new RangeError('Frequency Bucket configuration is incompatible with Track configuration.');
    }

    // console.log(frameBuffers);
    const fftSpectra = [];
    const field = new Array(frameBuffers.length);

    for (let i = 0; i < frameBuffers.length; i++) {
        fft.forward(frameBuffers[i]);
        fftSpectra[i] = fft.spectrum.slice();

        let sum = 0;
        let sampleCount = 0;
        let avg = 0;
        let lane = 0;
        for (let f = 0; f < fftSpectra[i].length; f++) {
            sampleCount++;
            const frequency = f * df;
            if (frequency + df >= frequencyBuckets[lane + 1]) {
                lanes[lane] = sum / sampleCount;
                sum = 0;
                sampleCount = 0;
                lane++;
            }
            sum += fftSpectra[i][f];
            avg += fftSpectra[i][f] / fftSpectra[i].length;
        }
        field[i] = {gems: lanes.slice(), loudness: avg, speed: 1};
    }

    // normalize loudness values
    const maxLoudness = field.reduce((max, val) => (val.loudness > max ? val.loudness : max), 0);
    console.log(maxLoudness);

    let sameLaneCount = 0;
    let lastLane = 0;

    const BLACK_GEM_TRIGGER = 13;
    let blackGemInterval = BLACK_GEM_TRIGGER;
    for (let o = 0; o < field.length; o++) {
        field[o].loudness /= maxLoudness;
        const loudestRange = getMaxIndex(field[o].gems);

        let gem = Gem.GREEN;
        if (loudestRange === lastLane) {
            if (++sameLaneCount > BLACK_GEM_TRIGGER - 1 &&
                (sameLaneCount % blackGemInterval === 1
                || sameLaneCount % blackGemInterval === 0)) {
                gem = Gem.BLACK;
                blackGemInterval = BLACK_GEM_TRIGGER + 3 * ~~(0.5 - random(o));
                // gem = random(o) > .5 ? Gems.Black : Gems.Basic;
            }
        }        else {
            sameLaneCount = 0;
        }

        field[o].gems.fill(0);
        field[o].gems[loudestRange] = gem;
        lastLane = loudestRange;
    }

    // The current "gems" is just based off the normalized loudness values of each frame
    // more complex analysis will be done later to generate actual gems
    return field;
}

function processMessage(e) {
    const audioField = generateAudioField(e.data.frameBuffers, e.data.frequencyBinCount, e.data.frameBuffers);
    postMessage({
        _id: e.data._id,
        audioField,
    });
}

self.addEventListener('message', processMessage);
