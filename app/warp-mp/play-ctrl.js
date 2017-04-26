/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const GameEvent = require('event-types').GameEvent;
const MatchEvent = require('event-types').MatchEvent;
const MDT = require('../mallet/mallet.dependency-tree').MDT;

module.exports = {PlayCtrl,
resolve: ADT => [
    ADT.ng.$stateParams,
    ADT.network.NetworkEntity,
    ADT.ng.$scope,
    ADT.ng.$timeout,
    ADT.ng.$state,
    ADT.network.Client,
    ADT.network.Clock,
    ADT.game.WarpGame,
    ADT.network.Connection,
    MDT.Log,
    PlayCtrl]};

/**
 *
 * @param $stateParams
 * @param NetworkEntity {NetworkEntity}
 * @param $scope
 * @param $timeout
 * @param $state
 * @param Client
 * @param Clock {Clock}
 * @param WarpGame {WarpGame}
 * @param Connection
 * @param Log
 * @constructor
 */
function PlayCtrl($stateParams, NetworkEntity, $scope, $timeout, $state, Client, Clock, WarpGame, Connection, Log) {
    if (Client.getUser() === null) {
       return $state.go('lobby');
    }

    const gameState = {
        LOADING: 0,
        SYNCING: 1,
        PLAYING: 2,
        ENDED: 4,
    };

    $scope.states = gameState;
    $scope.state = gameState.LOADING;
    $scope.secondsToStart = NaN;
    $scope.match = null;
    $scope.clientUser = null;

    function startGame() {
        $scope.state = gameState.PLAYING;
        $timeout(() => $scope.$broadcast(GameEvent.playStarted));

        const startTime = Clock.getNow();
        Log.out(`start play at ${startTime}`);
    }

    $scope.endGame =  function endGame() {
        $scope.state = gameState.ENDED;
        Client.emit(MatchEvent.requestEnd);
    };

    Client.addEventListener(MatchEvent.matchEnded, () => {
        $state.go('results', {matchId: $scope.match.getId()});
    });

    $scope.getPlayerInfo = () => {
        if ($scope.clientUser === null) {
            return '-';
        }

        return `${$scope.clientUser.getName()} (${Connection.getPing()} ms)`;
    };

    const loadedGame = NetworkEntity.getById(WarpGame, $stateParams.gameId)
        .then((game) => {
            if (!game) {
                Log.error(`No game was found with game id: ${$stateParams.gameId}`);
                $state.go('lobby');
                return null;
            }

            $scope.warpGame = game;
            $scope.clientUser = Client.getUser();
            $scope.match = game.getMatch();

            return $scope.match.getSong()
                .then(song => song.getBuffer())
                .then(() => {
                // Currently ignored by server (just waits for host to send level)
                Client.emit(GameEvent.clientLoaded);
            });
        }).catch((e) => {
        Log.error(e);
        $state.go('lobby');
    });

    // The game countdown will begin when all clients have loaded
    Client.addEventListener(GameEvent.clientsReady, () => {
        loadedGame.then(() => {
            $scope.state = gameState.SYNCING;
            const remainingStartTime = $scope.warpGame.getStartTime() - Clock.getNow();
            Log.out(`start match in ${remainingStartTime}`);

            $scope.secondsToStart = ~~(remainingStartTime / 1000);
            const countdownInterval = setInterval(() => {
                $scope.secondsToStart = Math.max($scope.secondsToStart - 1, 0);
            }, 1000);

            setTimeout(() => {
                startGame();
                clearInterval(countdownInterval);
            }, remainingStartTime);
        });
    });
}
