/**
 * Handles requests to the SoundCloud API endpoint
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.media').factory('media.source.SoundCloud', [
    'media.Source',
    'simple-request.HttpConfig',
    'media.const.Type',
    'media.AudioClip',
    'config.Path',
    sourceSoundCloudFactory,
]);

function sourceSoundCloudFactory(Source, HttpConfig, MediaType, AudioClip, Path) {
    class SoundCloud extends Source {

        constructor() {
            super('SoundCloud');
            this.apiUrl = `${Path.api}/soundcloud/`;
        }

        search(params) {
            if (params.term === '' || params.field !== 'name') {
                return super.search(params);
            }

            const url = this.getRequestUrl('search', {term: params.term});

            function trackCompare(a, b) {
                return parseInt(a.playback_count, 10) > parseInt(b.playback_count, 10) ? -1 : 1;
            }

            function getUser(track) {
                if (track && track.user && track.user.username) {
                    return track.user.username;
                }

                return '';
            }

            return this.queueRequest(HttpConfig.get(url))
                .then(results => results.sort(trackCompare) // Parse each track in the list
                    .map(track => new AudioClip({ // Load the local track into the cache
                        source: this,
                        sourceId: track.id,
                        name: track.title,
                        type: MediaType.Song,
                        artist: getUser(track),
                        deepLink: track.permalink_url,
                        duration: parseInt(track.duration / 1000, 10),
                        uri: track.stream_url,
                    })));
        }

        getRawBuffer(sourceId) {
            const url = this.getRequestUrl('track', {trackId: sourceId});
            // Example SoundCloud URI (using proxy script)
            // http://thunderlab.net/pulsar-media/api/soundcloud/tracks/231543423
            return super.getRawBuffer(new HttpConfig({
                url,
                responseType: 'arraybuffer',
            }));
        }
    }

    return new SoundCloud();
}
