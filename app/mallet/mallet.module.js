/**
 * Created by Greg on 11/27/2016.
 *
 * Library for interactive web apps
 * @module mallet
 */
const mallet = require('angular')
    .module('mallet', [
        require('../config.module'),
        require('./mallet.constants'),
        require('./math.svc'),
        require('../network/simple-request')]);

// Core
require('./state-machine.factory');
require('./log.svc');
require('./state.svc');
require('./scheduler.svc');
require('./thread.factory');
require('./async-request.factory');

// Input
require('./keyboard.svc.js');
require('./mouse-utils.svc');

// 3D Rendering
require('./camera.svc');
require('./geometry.svc');
require('./particle-emitter.factory');

// Canvas Wrapper
require('./color.svc');
require('./easel.directive');
require('./easel.svc');
require('./particle-emitter-2d.svc');

module.exports = mallet;
