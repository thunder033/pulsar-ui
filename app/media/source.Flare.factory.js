/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    'use strict';
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    angular.module('pulsar.media').factory('media.source.Flare', [
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
    function sourcePulsarFactory(Source, AsyncRequest, HttpConfig, AudioClip, MediaType, Path, $q){

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
                //If there's already tracks in the local cache don't load everything
                if(this._cachedTracks.length > 0){
                    return $q.when(this._cachedTracks);
                }

                //Request the local track listing, these tracks are permanently "cached"
                return AsyncRequest.send(new HttpConfig({
                    url: Path.media.Tracks
                })).then(trackList => {
                    //Parse each track in the list
                    return $q.all(trackList.map(track => {
                        var type = track.type || MediaType.Song,
                            fileName = track.name || track,
                            url = Path.media[type] + fileName;

                        //ensure the track exists before loading it
                        return this.queueRequest(new HttpConfig({
                            method: 'HEAD',
                            url: url
                        })).then(()=>{
                            //Load the local track into the cache
                            this._cachedTracks.push(new AudioClip({
                                source: this,
                                name: fileName,
                                type: type,
                                uri: url
                            }));
                        }, err => {
                            var status = err.status || err;
                            console.warn(`Pulsar track "${fileName}" could not be loaded: ${status}`);
                        });
                    })).then(()=>{
                        return this._cachedTracks;
                    });
                });
            }

            /**
             * @param {Object} params
             * @param {string} params.field
             * @param {string} params.term
             */
            search(params) {
                return this.isReady().then(()=>{
                    switch(params.field)
                    {
                        case 'name':
                            if(params.term.length === 0){
                                return $q.when(this._cachedTracks);
                            }

                            var term = params.term.toLowerCase();

                            var results = this._cachedTracks.filter(track => {
                                var name = track.getName().toLowerCase();
                                return (name.indexOf(term) > -1);
                            });

                            return $q.when(results);
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
                var track = this.getTrack(sourceId);

                return super.getRawBuffer(new HttpConfig({
                    url: track.uri,
                    responseType: 'arraybuffer'
                }));
            }
        }

        return new Flare();
    }
})();