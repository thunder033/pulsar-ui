/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

module.exports = {ResultsCtrl,
resolve: ADT => [
    ADT.game.ClientMatch,
    ADT.ng.$stateParams,
    ADT.ng.$scope,
    ResultsCtrl]};

function ResultsCtrl(ClientMatch, $stateParams, $scope) {
    $scope.match = null;
}
