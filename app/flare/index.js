/**
 * Created by gjrwcs on 10/25/2016.
 */
var flare = require('angular').module('pulsar.flare', []);

require('./flare.constants');
require('./audio-player.directive');
require('./control-panel.ctrl');
require('./control-panel.directive');
require('./flare.svc');
require('./frequency-analyzer.svc');
require('./frequency-pinwheel.svc');
require('./waveform-analyzer.svc');
require('./flare.ctrl');

/**
 * @type {IModule}
 */
module.exports = flare;