/**
 * Created by Greg on 11/21/2016.
 */
(()=>{
    'use strict';

    angular.module('pulsar.media').factory('media.Source', [
        'mallet.AsyncRequest',
        '$q',
        sourceFactory]);

    function sourceFactory(AsyncRequest, $q) {
        var sources = {},
            threadCount = 5,
            requestPool = AsyncRequest.createRequestPool(threadCount);

        class Source {
            /**
             *
             * @param {string} name
             * @constructor
             */
            constructor(name) {
                sources[name] = this;
                this.name = name;
                this._cachedTracks = [];
                this._tracks = {};
                this._active = true;
                this._opCount = 0;

                this._ready = this.loadCachedTracks();
            }

            deactivate(){
                this._active = false;
            }

            activate(){
                this._active = true;
            }

            toggleActive(){
                if(this.isActive()){
                    this.deactivate();
                }
                else {
                    this.activate();
                }
            }

            isWorking(){
                return this._opCount > 0;
            }

            /**
             * Indicates if the source is active and should be used for searches
             * @returns {boolean}
             */
            isActive(){
                return this._active;
            }

            /**
             *
             * @param reqType
             * @param params
             * @returns {*}
             * @protected
             */
            getRequestUrl(reqType, params){
                var reqUrl = this.apiUrl;
                switch(reqType) {
                    case 'search':
                        var term = encodeURIComponent(params.term);
                        reqUrl += `tracks?q=${term}&limit=50`;
                        break;
                    case 'track':
                        reqUrl += `tracks/${params.trackId}/stream`;
                        break;
                    default:
                        return null;
                }

                return reqUrl;
            }

            /**
             * Return the location of source icon
             * @returns {string}
             */
            getIcon() {
                var path = 'assets/images/',
                    name = this.getName().toLowerCase();
                return `${path}/${name}-icon.png`;
            }

            /**
             * The name of the source
             * @returns {string}
             */
            getName(){
                return this.name;
            }

            getCachedTracks() {
                return $q.when(this._cachedTracks);
            }

            loadCachedTracks() {
                return this.getCachedTracks().then(trackList => {
                    trackList.forEach(track => this._tracks[track.sourceId] = track);
                });
            }

            isReady() {
                return this._ready;
            }

            /**
             * Returns a list of audio tracks matching the term
             * @param {Object} params
             */
            search(params) {
                return $q.when([]);
            }

            /**
             * Send a request using the source request pool
             * @param config
             * @returns {Promise.<Object>|*}
             * @protected
             */
            queueRequest(config){
                this._opCount++;
                return requestPool.send(config)
                    .finally(()=>this._opCount--);
            }

            /**
             * Queues an http request and promises an audio buffer
             * @param {HttpConfig} config
             * @returns {Promise<ArrayBuffer>}
             */
            getRawBuffer(config) {
                this._opCount++;
                return requestPool.send(config)
                    .finally(()=>this._opCount--);
            }

            /**
             * Encapsulate source-specific requirements of loading an audio track
             * @param {string|number} sourceId
             * @returns {AudioClip}
             */
            getTrack(sourceId) {
                return this._tracks[sourceId];
            }
        }

        /**
         * Return the map of registered sources
         * @returns {{string: Source}}
         */
        Source.getSources = function(){
            return sources;
            //return Object.keys(sources).map(name => sources[name]);
        };

        return Source;
    }

   
})();