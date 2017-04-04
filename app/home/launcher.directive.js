'use strict';
/**
 * @ngdoc directive
 * @description Home menu and status messages to be included with different views
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular')
    .module('pulsar.home')
    .directive('pulsarLauncher', [pulsarLauncherDirective]);

function pulsarLauncherDirective(){
    return {
        restrict: 'E',
        templateUrl: 'views/pulsar-launcher.html',
        link: function () {
            
        }
    };
}
