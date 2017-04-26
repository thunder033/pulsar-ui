/**
 * The Game module defines behavior for the game client
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const ADT = require('../app.dependency-tree.js').ADT;

ADT.game = {
    Player: 'game.Player',
    ClientMatch: 'game.ClientMatch',
    PlayCtrl: 'game.PlayCtrl',
    ResultsCtrl: 'game.ResultsCtrl',
    WarpCtrl: 'game.WarpCtrl',
    ClientShip: 'game.ClientShip',
    WarpGame: 'game.WarpGame',
    WarpField: 'game.WarpField',
    LerpedEntity: 'game.LerpedEntity',
    WarpDrive: 'game.WarpDrive',
    MatchLoader: 'game.MatchLoader',
};

const game = require('angular')
    .module('game', [
        require('../network').name,
    ]);

game.service(ADT.game.MatchLoader, require('./match-loader').resolve(ADT));
game.factory(ADT.game.ClientMatch, require('./client-match').resolve(ADT));
game.controller(ADT.game.PlayCtrl, require('./play-ctrl').resolve(ADT));
game.controller(ADT.game.ResultsCtrl, require('./results-ctrl').resolve(ADT));
game.controller(ADT.game.WarpCtrl, require('./flux-ctrl').resolve(ADT));
game.factory(ADT.game.LerpedEntity, require('./lerped-entity').resolve(ADT));
game.factory(ADT.game.ClientShip, require('./client-ship').resolve(ADT));
game.factory(ADT.game.Player, require('./player').resolve(ADT));
game.factory(ADT.game.WarpField, require('./warp-field').resolve(ADT));
game.factory(ADT.game.WarpGame, require('./warp-game').resolve(ADT));
game.factory(ADT.game.WarpDrive, require('./warp-drive').resolve(ADT));

game.directive('numbersOnly', () => ({
    restrict: 'A',
    require: 'ngModel',
    link: (scope, elem, attr, ngModel) => {
        ngModel.$parsers.push((inputVal) => {
            const value = /\d*\.?\d{0,2}/.exec(inputVal)[0];

            if (inputVal !== value) {
                ngModel.$setViewValue(value);
                ngModel.$render();
            }

            return value;
        });
    },
}));

module.exports = game.name;
