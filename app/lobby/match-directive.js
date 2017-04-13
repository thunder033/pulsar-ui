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
    ADT.media.Playlist,
    matchDirective]};

function matchDirective(ClientMatch, PlayQueue, AudioPlayer, Playlist) {
    return {
        restrict: 'E',
        scope: {
            match: '=',
        },
        templateUrl: 'views/staging-match.html',
        controller: ['$scope', 'network.Client', function StagingMatchCtrl($scope, Client) {

            $scope.playlist = new Playlist();
            $scope.playQueue = new PlayQueue(AudioPlayer);

            $scope.playQueue.addEventListener('itemAdded', () => {
                $scope.match.setSong($scope.playQueue.getNext());
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
