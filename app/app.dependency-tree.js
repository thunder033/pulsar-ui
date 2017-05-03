/**
 * The intent of Application Dependency Tree is to provide easy (auto-completed!) access
 * to full module dependency names. This speeds typing and ensures accuracy.
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const strictAccess = require('./mallet/strict-access.js').strictAccess;

const ADT = {
    inject() { return 'ADT'; },
    MDT: 'MDT',
    ng: {
        $scope: '$scope',
        $rootScope: '$rootScope',
        $q: '$q',
        $state: '$state',
        $socket: 'socketFactory',
        $stateParams: '$stateParams',
        $timeout: '$timeout',
        $stateProvider: '$stateProvider',
        $locationProvider: '$locationProvider',
        $urlRouterProvider: '$urlRouterProvider',
    },
    config: 'config',
};

/**
 * @property ng.$location
 * @property ng.$scope
 * @property ng.$rootScope
 * @property ng.$q
 * @property ng.$state
 * @property ng.$socket
 * @property config.Path
 * @property const.ScaleFactor
 * @property const.SampleCount
 * @property const.MaxFrameRate
 * @property const.Keys
 * @property AsyncRequest
 * @property Camera
 * @property Color
 * @property Easel
 * @property Geometry
 * @property Keyboard
 * @property Log
 * @property Math
 * @property MouseUtils
 * @property ParticleEmitter
 * @property ParticleEmitter2D
 * @property Scheduler
 * @property State
 * @property StateMachine
 * @property Thread
 */
ADT.mallet = require('./mallet/mallet.dependency-tree').MDT;

module.exports = {ADT: strictAccess(ADT, 'ADT')};
