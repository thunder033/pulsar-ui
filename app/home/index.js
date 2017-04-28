/**
 * Components for the home screen and basic Pulsar settings
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const home = require('angular')
    .module('pulsar.home', []);

require('./home.ctrl');
require('./launcher.directive');

module.exports = home.name;
