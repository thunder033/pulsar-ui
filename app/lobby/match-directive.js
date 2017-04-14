/**
 * Display details about a match while waiting for enough users
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MatchEvent = require('event-types').MatchEvent;

module.exports = {matchDirective,
resolve: ADT => [
    ADT.game.ClientMatch,
    ADT.media.PlayQueue,
    ADT.audio.Player,
    matchDirective]};

function matchDirective(ClientMatch, PlayQueue, AudioPlayer) {
    return {
        restrict: 'E',
        scope: {
            match: '=',
        },
        templateUrl: 'views/staging-match.html',
        controller: ['$scope', 'network.Client', function StagingMatchCtrl($scope, Client) {
            $scope.playQueue = new PlayQueue(AudioPlayer);

            $scope.playQueue.addEventListener('itemAdded', () => {
                const song = $scope.playQueue.getNext();
                Client.emit(MatchEvent.setSong, {matchId: $scope.match.getId(), song: song.getParams()});
            });

            $scope.isHost = function isHost(user = Client.getUser()) {
                return $scope.match.getHost() === user;
            };

            $scope.startMatch = function startMatch() {
                Client.emit(MatchEvent.requestStart, {matchId: $scope.match.getId()});
            };

            $scope.leaveMatch = function leaveMatch() {
                Client.emit(MatchEvent.requestLeave);
            };

            const arrMaxSize = new Array(ClientMatch.MAX_MATCH_SIZE);
            $scope.getMaxSize = function getMaxSize() {
                return arrMaxSize;
            };
        }],
    };
}
