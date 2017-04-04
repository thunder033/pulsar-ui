/**
 * Handles requests to the SoundCloud API endpoint
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
'use strict';
require('angular').module('pulsar.media').factory('media.source.SoundCloud', [
    'media.Source',
    'simple-request.HttpConfig',
    'media.const.Type',
    'media.AudioClip',
    'config.Path',
    sourceSoundCloudFactory
]);

function sourceSoundCloudFactory(Source, HttpConfig, MediaType, AudioClip, Path){

    class SoundCloud extends Source {

        constructor() {
            super('SoundCloud');
            this.apiUrl = `${Path.api}/soundcloud/`;
        }

        search(params) {
            if(params.term === '' || params.field !== 'name'){
                return super.search(params);
            }

            var url = this.getRequestUrl('search', {term: params.term});

            function trackCompare(a, b)
            {
                return parseInt(a.playback_count) > parseInt(b.playback_count) ? -1 : 1;
            }

            function getUser(track)
            {
                if(track && track.user && track.user.username){
                    return track.user.username;
                }

                return '';
            }
            return this.queueRequest(HttpConfig.get(url))
                .then(results => {
                    //Parse each track in the list
                    return results.sort(trackCompare).map(track => {
                        //Load the local track into the cache
                        return new AudioClip({
                            source: this,
                            sourceId: track.id,
                            name: track.title,
                            type: MediaType.Song,
                            artist: getUser(track),
                            deepLink: track.permalink_url,
                            duration: parseInt(track.duration / 1000),
                            uri: track.stream_url
                        });
                    });
                });
        }

        getRawBuffer(sourceId) {
            var url = this.getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return super.getRawBuffer(new HttpConfig({
                url: url,
                responseType: 'arraybuffer'
            }));
        }
    }

    return new SoundCloud();
}