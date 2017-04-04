/**
 * Created by gjr8050 on 9/16/2016.
 */
'use strict';
require('angular').module('shared').directive('es6WarningBanner', function(){
    return {
        restrict: 'CEA',
        link: function (scope, elem) {
            (()=>{elem[0].style.display = 'none';})();
        }
    };
});