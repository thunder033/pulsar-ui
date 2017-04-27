/**
* Created by gjr8050 on 9/16/2016.
*/
require('angular').module('pulsar.media').service('media.Library', [
    '$q',
    'media.const.Type',
    'media.Source',
    'media.const.Sources',
    '$injector',
    Library]);

function Library($q, MediaType, Source, Sources, $injector) {
    const ready = $q.defer();
    const clips = {};
    const sources = {};
    const clipList = [];

    this.init = () => {
        // Invoke the creation of each (enabled) source
        Object.keys(Sources).forEach((source) => {
            if (Sources[source] === true) {
                $injector.get(`media.source.${source}`);
            }
        });
        // Get a reference to the sources collection
        Object.assign(sources, Source.getSources());
    };

    /**
     * Return the values from a map
     * @param {Object} map
     * @returns {Array} an array of the values
     */
    function values(map) {
        return Object.keys(map).map(key => map[key]);
    }

    /**
     * Returns promise that resolves when the clips have been loaded
     * @returns {Promise}
     */
    this.isReady = () => $q.all(values(sources).map(source => source.isReady()));

    /**
     * Return the audio clip with the given id or name
     * @param id {string|number}
     * @returns {Promise<AudioClip>}
     */
    this.getAudioClip = (id) => { // eslint-disable-line
        return ready.promise.then(() => {
            if (typeof id === 'number') {
                return clips[id];
            } else if (typeof id === 'string') {
                return clipList.reduce((clip, curClip) => {
                    return !clip && curClip.name === id ? curClip : clip;
                }, null);
            }

            return null;
        });
    };

    /**
     * Get the ranking of the track in the search
     * @param {AudioClip} clip
     * @param {Object} params
     * @returns {number} 0 - 10, where 0 is better
     */
    function getSearchRank(clip) {
        return clip.getRank();
    }

    function search(field, term) {
        const defer = $q.defer();
        const searchList = new PriorityQueue();

        // define parameters to search for audio clips with
        const searchParam = {field, term};

        function mergeResults(results) {
            // start providing resources as soon as a source returns
            results.forEach((clip) => {
                const rank = getSearchRank(clip, searchParam);
                searchList.enqueue(rank, clip);
            });
            defer.notify(searchList);
        }

        // invoke a search from each source
        $q.all(values(sources)
            .filter(source => source.isActive())
            .map(source => source.search(searchParam).then(mergeResults)))
        // indicate when the search has completed
            .then(() => defer.resolve(searchList))
            .catch(defer.reject);

        return defer.promise;
    }

    this.searchByName = term => search('name', term);

    /**
     * Get all audio clips of one type
     * @param type {media.Type}
     * @returns {Promise<PriorityQueue>}
     */
    this.getAudioClips = type => search('type', type || MediaType.Song);
}
