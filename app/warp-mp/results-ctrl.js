/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

module.exports = {ResultsCtrl,
resolve: ADT => [
    ADT.game.ClientMatch,
    ADT.ng.$stateParams,
    ADT.ng.$scope,
    ADT.ng.$state,
    ResultsCtrl]};

function ResultsCtrl(ClientMatch, $stateParams, $scope, $state) {
    $scope.match = null;
    $state.go('lobby'); // just forward back to the lobby for now....
}
