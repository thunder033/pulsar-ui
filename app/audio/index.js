/**
 * Created by Greg on 11/27/2016.
 */

/**
 * Utilities and services for playback and analysis of audio
 * @module pulsar.audio
 */
var audio = require('angular')
    .module('pulsar.audio', []);

require('./audio.constants');
require('./audio-fx.svc');
require('./audio-player.svc');
require('./data-utils.svc');
require('./realtime-data.svc');
require('./volume.directive');

/**
 * @type {IModule}
 * @property {string} name = pulsar.audio
 */
module.exports = audio;