/**
 * Created by Greg on 11/27/2016.
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.warp').factory('warp.Bar', [MDT.Math, function(MM){
    return {
        //dimensions of the flanking bars
        scale: MM.vec3(1.5, 1, 0.9),
        margin: 0.1
    };
}]);