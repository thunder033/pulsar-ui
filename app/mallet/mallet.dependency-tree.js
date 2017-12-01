/**
 * Provide accurate, quick access to full list of mallet dependencies
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const strictAccess = require('./strict-access.js').strictAccess;

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
const MDT = {
    ng: {
        $location: '$location',
        $scope: '$scope',
        $rootScope: '$rootScope',
        $q: '$q',
        $state: '$state',
        $socket: 'socketFactory',
        $window: '$window',
    },
    config: {
        Path: 'config.Path',
    },
    const: {
        ScaleFactor: 'mallet.const.ScaleFactor',
        SampleCount: 'mallet.const.SampleCount',
        MaxFrameRate: 'mallet.const.MaxFrameRate',
        Keys: 'mallet.const.Keys',
    },
    AsyncRequest: 'mallet.AsyncRequest',
    Camera: 'mallet.Camera',
    Color: 'mallet.Color',
    mEasel: 'mEasel',
    Easel: 'mallet.Easel',
    Geometry: 'mallet.Geometry',
    Keyboard: 'mallet.Keyboard',
    Log: 'mallet.Log',
    Math: 'mallet.Math',
    MouseUtils: 'mallet.MouseUtils',
    ParticleEmitter: 'mallet.ParticleEmitter',
    ParticleEmitter2D: 'mallet.ParticleEmitter2D',
    Scheduler: 'mallet.Scheduler',
    State: 'mallet.State',
    StateMachine:'mallet.StateMachine',
    Thread: 'mallet.Thread',
};

module.exports = {MDT: strictAccess(MDT, 'MDT')};
