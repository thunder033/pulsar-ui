/**
 * Created by gjrwcs on 10/25/2016.
 */

// https://github.com/corbanbrook/dsp.js
const dsp = require('../dsp');

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
    const frequencyRanges = [0, 400, 650, 21050];
    const lanes = new Array(3); // frequencyRanges = [0, 60, 250, 2000, 6000, 21050],
    const df = 21050 / (frameBuffers[0].length / 2); // delta-frequency between indices after FFT

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
            if (frequency + df >= frequencyRanges[lane + 1]) {
                lanes[lane] = sum / sampleCount;
                sum = 0;
                sampleCount = 0;
                lane++;
            }
            sum += fftSpectra[i][f];
            avg += fftSpectra[i][f] / fftSpectra[i].length;
        }
        field[i] = {gems: lanes.slice(), loudness: avg};
    }

    // normalize loudness values
    const maxLoudness = field.reduce((max, val) => (val.loudness > max ? val.loudness : max), 0);
    console.log(maxLoudness);

    let sameLaneCount = 0;
    let lastLane = 0;
    const Gems = {
        Basic: 1,
        // 2 is collected
        Black: 3,
    };

    let blackGemInterval = 13;
    for (let o = 0; o < field.length; o++) {
        field[o].loudness /= maxLoudness;
        const loudestRange = getMaxIndex(field[o].gems);

        let gem = Gems.Basic;
        if (loudestRange === lastLane) {
            if (++sameLaneCount > 12 &&
                (sameLaneCount % blackGemInterval === 1
                || sameLaneCount % blackGemInterval === 0)) {
                gem = Gems.Black;
                blackGemInterval = 13 + 3 * ~~(0.5 - random(o));
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
