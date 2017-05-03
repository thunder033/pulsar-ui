/**
 * Components for the home screen and basic Pulsar settings
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const ADT = require('../app.dependency-tree.js').ADT;

const home = require('angular')
    .module('pulsar.home', []);

ADT.home = {
    HomeCtrl: 'home.HomeController',
};

require('./home.ctrl');
require('./launcher.directive');

module.exports = home.name;
