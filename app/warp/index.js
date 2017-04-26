/**
 * Created by gjrwcs on 10/25/2016.
 *
 * Game Behavior and Logic for Warp
 * @module pulsar.warp
 */
const warp = require('angular').module('pulsar.warp', []);

const ADT = require('../app.dependency-tree.js').ADT;

ADT.warp = {
    Level: 'warp.Level',
    LevelLoader: 'warp.LevelLoader',
    WarpField: 'warp.WarpField',
    Bar: 'warp.Bar',
    State: 'warp.State',
    WarpFieldCache: 'warp.WarpFieldCache',
};

require('./bar.factory');
require('./game.controller');
require('./hud.directive');
require('./level-loader.svc');
require('./level.svc');
require('./scoring.svc');
require('./ship.svc');
require('./ship-effects.svc');
require('./warp-field.factory');
require('./warp-field-cache.svc');
require('./warp-field-draw.svc');
require('./state.svc');

module.exports = warp.name;
