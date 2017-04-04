'use strict';
/**
 * Created by Greg on 12/4/2016.
 */
require('angular')
    .module('pulsar.flare')
    .controller('flare.FlareController', ['Flare', '$timeout', FlareCtrl]);

function FlareCtrl(Flare, $timeout) {
    $timeout(()=>Flare.init());
}