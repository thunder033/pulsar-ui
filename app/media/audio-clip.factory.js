/**
 * Created by gjr8050 on 11/16/2016.
 */
(()=>{
    'use strict';

    angular.module('pulsar.media').factory('media.AudioClip', [
        'media.const.Type',
        'media.const.State',
        'audio.DataUtils',
        '$q',
        'media.IPlayable',
        _Clip]);

    /**
     * Returns a factory reference to the AudioClip constructor
     * @returns {{AudioClip: AudioClip}}
     * @private
     */
    function _Clip(MediaType, MediaState, DataUtils, $q, IPlayable){
        /**
         * Derive a more readable name from a file name
         * @param fileName
         * @returns {string}
         */
        function getNiceName (fileName) {
            var fileExts = ['mp3','wav'];
            var pcs = fileName.split('.');
            var ext = pcs.pop();
            return (fileExts.indexOf(ext) > -1) ? pcs.join('.') : ext;
        }

        /**
         * Maintains metadata and content for an audio clip
         * @property {number} id
         * @property {string} name
         * @property {string} uri
         * @property {Source} source
         * @property {string} artist
         * @implements IPlayable
         */
        class AudioClip extends IPlayable {
            /**
             * @param {Object} params
             * @param {Source} params.source
             * @param {Object} [params.id] Provides an ID of a cached audio clip to load
             * @param {string} [params.sourceId]
             * @param {string} [params.name]
             * @param {media.Type} [params.type]
             * @param {string} [params.uri]
             * @param {number} [params.sourceRank]
             * @param {string} [params.artist='Unknown']
             * @param {string} [params.deepLink='']
             * @param {string} [params.album='']
             * @param {number} [params.duration] The length of the clip in seconds
             * @constructor
             */
            constructor(params) {
                super();

                if(typeof params.id === 'undefined'){
                    this.id = AudioClip.getNewId();
                    this.sourceId = '' + (params.sourceId || this.id);
                    this.name = getNiceName(params.name);
                    this.uri = params.uri || params.name;
                    this.type = params.type || MediaType.Song;
                    this.clip = null;
                    this.buffer = null;
                    this.source = params.source;
                    this.duration = params.duration;

                    this.rank = params.sourceRank || 0;

                    this.deepLink = params.deepLink || '';
                    this.artist = params.artist || 'Unknown';
                    this.album = params.album || '';

                    this.state = MediaState.Ready;
                }
                else {
                    throw new ReferenceError('Cached Clips not yet supported');
                }
            }

            getDuration(){
                if(!this.duration && this.buffer !== null){
                    return this.buffer.duration;
                }
                
                return this.duration || NaN;
            }

            /**
             * Returns a string with the artist and album
             */
            getInfo(){
                var info = '';
                info += this.artist ? this.artist : '';
                info += this.artist && this.album ? ' - ' : '';
                info += this.album ? this.album : '';
                return info;
            }

            /**
             * Return the location of the original source content
             * @returns {string|string|*}
             */
            getDeepLink(){
                return this.deepLink;
            }

            /**
             * The relative importance of the track, 0 - 10, where 0 is better
             * @returns {number}
             */
            getRank(){
                return this.rank;
            }

            /**
             * The name of the audio clip, derived from file name
             * @returns {string}
             */
            getName() {
                return this.name;
            }

            /**
             * Load the audio buffer for this clip
             * @returns {Promise}
             * @private
             */
            _loadBuffer() {
                this.state = MediaState.Buffering;
                return this.source.getRawBuffer(this.sourceId)
                    .then(DataUtils.getAudioBuffer)
                    .then(buffer => {
                        this.buffer = buffer;
                        this.state = MediaState.Buffered;
                        return buffer;
                    }).catch(err => {
                        //Temporary error handling until we get an error service
                        console.log(err);
                        this.state = MediaState.Error;
                        return $q.reject(err);
                    });
            }

            /**
             * Retrieve the clip's audio buffer, loading it if necessary
             * @returns {IPromise<AudioBuffer>|Promise}
             */
            getBuffer() {
                //console.log(this.buffer.length);
                return $q.when(this.buffer || this._loadBuffer());
            }

            /**
             * @returns {string|media.State}
             */
            getState() {
                return this.state;
            }


        }

        AudioClip._IdKey = 'pulsar-media-item-id';
        AudioClip.autoIncrementId = parseInt(localStorage.getItem(AudioClip._IdKey)) || 0;

        /**
         * @returns {Number|number|*}
         */
        AudioClip.getNewId = function() {
            localStorage.setItem(AudioClip._IdKey, ++AudioClip.autoIncrementId);
            return AudioClip.autoIncrementId;
        };

        return AudioClip;
    }
})();