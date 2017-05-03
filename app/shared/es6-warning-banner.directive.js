/**
 * Created by gjr8050 on 9/16/2016.
 */
require('angular').module('shared').directive('es6WarningBanner', () => ({
    restrict: 'CEA',
    link(scope, elem) {
        (() => { elem[0].style.display = 'none'; })();
    },
}));
