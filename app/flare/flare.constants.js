/**
 * Created by Greg on 11/27/2016.
 */
require('angular').module('pulsar.flare')
    //Visualization
    .constant('flare.const.Effects', Object.freeze({
        NOISE: 'NOISE',
        INVERT: 'INVERT',
        DESATURATE: 'DESATURATE'
    }));