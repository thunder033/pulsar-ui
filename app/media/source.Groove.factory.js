'use strict';
/**
 * Handles requests to the Groove API endpoint
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
require('angular').module('pulsar.media').factory('media.source.Groove', [
    'media.Source',
    'simple-request.HttpConfig',
    'media.AudioClip',
    'media.const.Type',
    'media.GrooveAuth',
    'config.Path',
    sourceGrooveFactory
]);

/**
 *
 * @param Source
 * @param HttpConfig
 * @param AudioClip
 * @param MediaType
 * @param {GrooveAuth} GrooveAuth
 * @param {config.Path} Path
 * @returns {Groove}
 */
function sourceGrooveFactory(Source, HttpConfig, AudioClip, MediaType, GrooveAuth, Path){


    function trackCompare(a, b)
    {
        return parseInt(a.playback_count) > parseInt(b.playback_count) ? -1 : 1;
    }

    function getTracks(result) {
        return result.Tracks.Items;
    }

    function getArtistString(artists) {
        return artists.map(artist => artist.Artist.Name).join(', ');
    }

    /**
     * Convert a time string to a duration in seconds
     * @param {string} time
     * @returns {number}
     */
    function getSeconds(time){
        return time.split(':')
            .reverse()
            .reduce((dur, unit, i)=>dur + (unit || 0) * (i * 60 | 1), 0);
    }

    class Groove extends Source {

        constructor(){
            super('Groove');
            this.apiUrl = `${Path.api}/groove/`;

            if(!GrooveAuth.isAuthenticated()){
                this.deactivate();
            }
        }

        /**
         * Only active the groove service if we can authenticate with Microsoft AD
         */
        activate(){
            if(!GrooveAuth.isAuthenticated()){
                GrooveAuth.login().then(()=>{
                    this.queueRequest(new HttpConfig({
                        url: `${this.apiUrl}subscription`,
                        queryParams: {authToken: GrooveAuth.getAccessToken()}
                    })).then(resp => {
                        if(resp.HasSubscription === true){
                            console.log('Has Groove Music Pass');
                            super.activate();
                        }
                        else {
                            console.warn('No Groove Music Pass');
                            //Since were only doing previews, don't have to worry about music pass...
                            //GrooveAuth.logout();
                            super.activate();
                        }
                    });
                });
            }
            else {
                super.activate();
            }
        }

        search(params) {
            // optional
            if(params.term === '' || params.field !== 'name'){
                return super.search(params);
            }

            this.activate();

            var url = this.getRequestUrl('search', {term: params.term});

            return this.queueRequest(HttpConfig.get(url))
                .then(getTracks)
                .then(results => {
                    //Parse each track in the list
                    return results.sort(trackCompare).map(track => {
                        //Load the local track into the cache
                        return new AudioClip({
                            source: this,
                            sourceId: track.Id,
                            name: track.Name,
                            type: MediaType.Song,
                            artist: getArtistString(track.Artists),
                            deepLink: track.Link,
                            album: track.Album.Name,
                            duration: getSeconds(track.Duration),
                            uri: `${this.apiUrl}/tracks/${track.Id}/stream`
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
                queryParams: {
                    authToken: GrooveAuth.getAccessToken(),
                    clientInstanceId: GrooveAuth.getClientId()
                },
                responseType: 'arraybuffer'
            }));
        }
    }

    return new Groove();
}