/**
* Created by Greg on 11/21/2016.
*/

const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.media').factory('media.source.Flare', [
    'media.Source',
    MDT.AsyncRequest,
    'simple-request.HttpConfig',
    'media.AudioClip',
    'media.const.Type',
    'config.Path',
    '$q',
    sourcePulsarFactory]);

/**
 * @returns {Flare}
 */
function sourcePulsarFactory(Source, AsyncRequest, HttpConfig, AudioClip, MediaType, Path, $q) {
    /**
     * @extends Source
     */
    class Flare extends Source {
        constructor() {
            super('Flare');
        }

        /**
         * Retrieves the cache or loads local files into it if empty
         * @returns {Promise<AudioClip[]>} cachedTracks
         */
        getCachedTracks() {
            // If there's already tracks in the local cache don't load everything
            if (this._cachedTracks.length > 0){
                return $q.when(this._cachedTracks);
            }

            // Request the local track listing, these tracks are permanently "cached"
            return AsyncRequest.send(new HttpConfig({
                url: Path.media.Tracks,
                // eslint-disable-next-line
            })).then((trackList) => {
                // Parse each track in the list
                return $q.all(trackList.map((track) => {
                    const type = track.type || MediaType.Song;
                    const fileName = track.name || track;
                    const url = Path.media[type] + fileName;
                    const sourceId = track.id;

                    // ensure the track exists before loading it
                    return this.queueRequest(new HttpConfig({
                        method: 'HEAD',
                        url,
                    })).then(() => {
                        // Load the local track into the cache
                        this._cachedTracks.push(new AudioClip({
                            sourceId,
                            source: this,
                            name: fileName,
                            type,
                            uri: url,
                        }));
                    }, (err) => {
                        const status = err.status || err;
                        console.warn(`Pulsar track "${fileName}" could not be loaded: ${status}`);
                    });
                })).then(() => this._cachedTracks);
            });
        }

        /**
         * @param {Object} params
         * @param {string} params.field
         * @param {string} params.term
         */
        search(params) {
            return this.isReady().then(() => {
                switch (params.field) {
                    case 'name': {
                        if (params.term.length === 0) {
                            return $q.when(this._cachedTracks);
                        }

                        const term    = params.term.toLowerCase();
                        const results = this._cachedTracks.filter((track) => {
                            const name = track.getName().toLowerCase();
                            return (name.indexOf(term) > -1);
                        });

                        return $q.when(results);
                    }
                    case 'type':
                        return $q.when(this._cachedTracks.filter(track => track[params.field] === params.term));
                    default:
                        return $q.when(this._cachedTracks);
                }
            });
        }

        /**
         * Loads the audio data for the given track
         * @param {string|number} sourceId
         */
        getRawBuffer(sourceId) {
            const track = this.getTrack(sourceId);

            return super.getRawBuffer(new HttpConfig({
                url: track.uri,
                responseType: 'arraybuffer',
            }));
        }
    }

    return new Flare();
}
