/**
 * Created by gjr8050 on 11/16/2016.
 */
'use strict';
/**
 * Sourcing and access of media content
 * @ngdoc module
 * @name pulsar.media
 */
var media = require('angular').module('pulsar.media', [
    require('../config.module').name,
    require('angular-cookies')
]);

require('./media.constants');

require('./i-playable.factory.js');
require('./audio-clip.factory');
require('./playlist.factory');
require('./play-queue.factory');

require('./media-widget.directive');
require('./play-queue.directive');
require('./playlist.directive');

require('./media-library.svc');
require('./source.factory');
require('./source.Flare.factory.js');
require('./source.SoundCloud.factory');
require('./groove-auth.svc');
require('./source.Groove.factory');

media.config(['config.PathProvider', 'config.Env', function(pathProvider, Env){
    var base = 'assets/audio/';
    pathProvider.addPath('media', {
        Base: base,
        ReverbImpulse: base + '/reverb-impulses/',
        Song: Env === 'dev' ? base + 'songs/' : 'https://thunderlab.net/pulsar-media/songs/',
        Effect: base + 'effects/',
        Tracks: 'assets/data/localAudio.json'
    });
}]).run(['media.Library', function (MediaLibrary) {
    MediaLibrary.init();
}]);

/**
 * @type {IModule}
 */
module.exports = media;