/**
 * Created by gjr8050 on 9/14/2016.
 */

const MDT = require('./mallet/mallet.dependency-tree').MDT;
const ADT = require('./app.dependency-tree').ADT;
// misc local dependencies
window.PriorityQueue = require('priority-queue').PriorityQueue;
require('../assets/js/load-error');

require('angular').module('pulsar', [
    require('./config.module'),
    require('./app.constants'),
    require('./shared'),
    require('./mallet'),
    require('./home'),
    require('./flare'),
    require('./audio'),
    require('./warp'),
    require('./media'),
    require('./network/simple-request'),
    require('./lobby'),
    require('./network'),
    require('./warp-mp'),
    require('angular-q-spread'),
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
    }).state('play', { // eslint-disable-line
        url: '/play/:gameId',
        templateUrl: 'views/play.html',
        controller: ADT.game.PlayCtrl,
    }).state('results', { // eslint-disable-line
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
