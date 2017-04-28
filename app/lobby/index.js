/**
 * Created by gjr8050 on 2/24/2017.
 */
const ADT = require('../app.dependency-tree.js').ADT;

ADT.lobby = {
    LobbyCtrl: 'lobby.LobbyCtrl',
    stagingMatch: 'stagingMatch',
};

const lobby = require('angular')
    .module('client.lobby', [
        require('../network'),
        require('../warp-mp')]);

lobby.controller(ADT.lobby.LobbyCtrl, require('./lobby-ctrl').resolve(ADT));
lobby.directive(ADT.lobby.stagingMatch, require('./match-directive').resolve(ADT));

module.exports = lobby.name;
