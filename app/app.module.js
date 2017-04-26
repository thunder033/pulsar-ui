/**
 * Created by gjr8050 on 9/14/2016.
 */

const MDT = require('./mallet/mallet.dependency-tree').MDT;
const ADT = require('./app.dependency-tree').ADT;
// misc local dependencies
window.PriorityQueue = require('priority-queue').PriorityQueue;
require('../assets/js/load-error');

// external dependencies
const angular = require('angular'),

    mallet = require('./mallet'),
    simpleRequest = require('./network/simple-request'),

    // Pulsar modules
    shared = require('./shared'),
    audio = require('./audio'),
    media = require('./media'),
    flare = require('./flare'),
    lobby = require('./lobby'),
    network = require('./network'),
    home = require('./home');

require('angular-q-spread');

const app = angular.module('pulsar', [
    require('./config.module'),
    require('./app.constants'),
    require('./shared'),
    mallet.name,
    home.name,
    flare.name,
    audio.name,
    require('./warp'),
    media.name,
    simpleRequest.name,
    lobby.name,
    network.name,
    require('./warp-mp'),
    '$q-spread',
    require('checklist-model'),
    require('angular-ui-router'),
]).config([
    ADT.ng.$stateProvider,
    ADT.ng.$urlRouterProvider,
    ADT.ng.$locationProvider,
    configuration,
]).run([
    MDT.Scheduler,
    ADT.ng.$rootScope,
    'audio.Player',
    MDT.Log,
    run]);

function configuration($stateProvider, $urlRouterProvider, $locationProvider) {
    // message about error messages
    console.info('READMEEEEE: Any HEAD requests with status 404 are expected.' +
        ' Network errors cannot be suppressed through JavaScript.');
    $urlRouterProvider.otherwise('/home');
    $locationProvider.hashPrefix('');

    $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'views/home.html',
        controller: 'home.HomeController',
    }).state('flare', {
        url: '/flare',
        template: '<control-panel></control-panel><m-easel id="visualizer"></m-easel>',
        controller: 'flare.FlareController',
    }).state('warp', {
        url: '/warp',
        template: '<m-easel id="warp"></m-easel><warp-hud></warp-hud>',
        controller: 'warp.GameController',
    }).state('lobby', {
        url: '/lobby',
        templateUrl: 'views/lobby.html',
        controller: ADT.lobby.LobbyCtrl,
    }).state('play', {
        url: '/play/:gameId',
        templateUrl: 'views/play.html',
        controller: ADT.game.PlayCtrl,
    }).state('results', {
        url: '/results/:matchId',
        templateUrl: 'views/results.html',
        controller: ADT.game.ResultsCtrl,
    });
}

function run(MScheduler, $rootScope, AudioPlayer, Log) {
    Log.config({level: Log.Info});
    MScheduler.startMainLoop();

    $rootScope.$on('$stateChangeStart', () => {
        AudioPlayer.stop();
        MScheduler.reset();
    });
}
