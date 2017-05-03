/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

module.exports = {menuDirective,
resolve: ADT => [
    ADT.inject(),
    menuDirective,
]};

function menuDirective(ADT) {
    return {
        restrict: 'E',
        scope: {
            player: '=',
        },
        templateUrl: 'views/warp-menu.html',
        controller: ADT.game.FlowController,
    };
}
