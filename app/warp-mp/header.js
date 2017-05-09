/**
 * Created by gjrwcs on 5/9/2017.
 */
module.exports = {warpHeader,
resolve: ADT => [ // eslint-disable-line
    warpHeader]};

function warpHeader() {
    return {
        restrict: 'E',
        templateUrl: 'views/warp-header.html',
        scope: {title: '='},
        link(scope) {
            scope.title = scope.title || '';
        },
    };
}
