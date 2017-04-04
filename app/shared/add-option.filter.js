/**
 * Created by gjr8050 on 11/18/2016.
 */
(()=>{
    'use strict';

    angular.module('pulsar').filter('addOption', [addOption]);

    function addOption(){
        return function(options, option){
            options = options || [];
            options.push(option);
            return options;
        };
    }
})();