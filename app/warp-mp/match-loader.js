/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MatchEvent = require('event-types').MatchEvent;

module.exports = {MatchLoader,
resolve: ADT => [
    ADT.warp.LevelLoader,
    ADT.network.Client,
    ADT.media.Source,
    ADT.media.AudioClip,
    MatchLoader]};

/**
 * This module functions as a bridge between existing non-network modules
 * and the multiplayer adapted code
 *
 * @param LevelLoader
 * @param Client
 * @param Source
 * @param AudioClip
 * @constructor
 *
 * @method loadMatch
 * @method reconstructSong
 */
function MatchLoader(LevelLoader, Client, Source, AudioClip) {
    // This generates the local (non-networked) version of the warp field
    // and uploads it to the server so it can be synced to each client (as
    // a NetworkEntity)
    //
    // The level is generated on the host because the it is a processor
    // intensive task and all of the code already exists and work correctly
    // as is w/o transcribing to server code
    this.loadMatch = match =>
        match.getSong()
            .then(LevelLoader.getWarpField)
            .then((warpField) => { Client.emit(MatchEvent.uploadLevel, warpField); });

    this.reconstructSong = (params) => {
        const source = Source.getSources()[params.sourceName];
        params.source = source;

        // TODO probably want to cache the new track in the source somehow...
        return source.getCachedTracks()
            .then(tracks => tracks[params.sourceId] || new AudioClip(params));
    };
}
