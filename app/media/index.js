/**
 * Created by gjr8050 on 11/16/2016.
 *
 * Sourcing and access of media content
 * @ngdoc module
 * @name pulsar.media
 */
const ADT = require('../app.dependency-tree.js').ADT;

const media = require('angular').module('pulsar.media', [
    require('../config.module'),
    require('angular-cookies'),
]);

ADT.media = {
    AudioClip: 'media.AudioClip',
    IPlayable: 'media.IPlayable',
    Playlist: 'media.Playlist',
    PlayQueue: 'media.PlayQueue',
    Source: 'media.Source',
};

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

media.config(['config.PathProvider', 'config.Env', (pathProvider, Env) => {
    const base = 'assets/audio/';
    pathProvider.addPath('media', {
        Base: base,
        ReverbImpulse: `${base}/reverb-impulses/`,
        Song: Env === 'dev' ? `${base}songs/` : 'https://thunderlab.net/pulsar-media/songs/',
        Effect: `${base}effects/`,
        Tracks: 'assets/data/localAudio.json',
    });
}]).run(['media.Library', (MediaLibrary) => {
    MediaLibrary.init();
}]);

/**
 * @type {IModule}
 */
module.exports = media.name;
