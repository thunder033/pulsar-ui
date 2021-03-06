/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const MatchEvent = require('event-types').MatchEvent;
const EntityType = require('entity-types').EntityType;
const MDT = require('../mallet/mallet.dependency-tree').MDT;

module.exports = {matchFactory,
resolve: ADT => [
    ADT.network.Connection,
    ADT.network.ClientRoom,
    ADT.network.User,
    ADT.network.NetworkEntity,
    ADT.ng.$rootScope,
    ADT.media.IPlayable,
    ADT.game.MatchLoader,
    ADT.ng.$q,
    MDT.Log,
    matchFactory]};

function matchFactory(Connection, ClientRoom, User, NetworkEntity, $rootScope, IPlayable, MatchLoader, $q, Log) {
    const matches = new Map();
    const matchList = [];

    class ClientMatch extends ClientRoom {

        constructor(params) {
            super(params);
            this.host = null;
            this.song = null;
            this.started = false;
            this.startTime = NaN;

            this.defer = $q.defer();
        }

        sync(data) {
            NetworkEntity.getById(User, data.host).then((user) => { this.host = user; });
            delete data.host;
            super.sync(data);
        }

        setSong(song) {
            this.song = song;
            this.defer.resolve(song);
        }

        getSong() {
            return $q.when(this.song || this.defer.promise);
        }

        isOpen() {
            return this.users.size < this.capacity && this.started === false;
        }

        getHost() {
            return this.host;
        }

        hasStarted() {
            return this.started;
        }

        canStart() {
            return this.users.size >= ClientMatch.MIN_START_USERS &&
                this.started === false &&
                this.song instanceof IPlayable;
        }

        onStart(gameId) {
            this.started = true;
            if (Connection.getUser() === this.getHost()) {
                MatchLoader.loadMatch(this).catch(Log.error);
            }
            updateMatchList();
            $rootScope.$broadcast(MatchEvent.matchStarted, {match: this, gameId, clientEvent: true});
        }

        onEnd() {
            $rootScope.$broadcast(MatchEvent.matchEnded, {match: this, clientEvent: true});
        }

        getLabel() {
            return this.label;
        }

        static getMatchSet() {
            return matchList;
        }
    }

    ClientMatch.MIN_START_USERS = 2;
    ClientMatch.MAX_MATCH_SIZE = 2;

    function updateMatchList() {
        matchList.length = 0;
        const it = matches.values();
        let item = it.next();
        while (item.done === false) {
            if (item.value.isOpen()) {
                matchList.push(item.value);
            }

            item = it.next();
        }
    }

    function addMatch(matchId) {
        if (!matchId) {
            return;
        }

        NetworkEntity.getById(ClientRoom, matchId).then((match) => {
            matches.set(matchId, match);
            updateMatchList();
        });
    }

    function parseMatchIds(data) {
        matches.clear();
        data.forEach(addMatch);
        updateMatchList();
    }

    function triggerMatchStart(data) {
        matches.get(data.matchId).onStart(data.gameId);
    }

    function triggerMatchEnd(data) {
        matches.get(data.matchId).onEnd();
    }

    function setMatchSong(data) {
        if (typeof data.song === 'object' && data.song !== null) {
            MatchLoader.reconstructSong(data.song).then((song) => {
                Log.debug(song);
                matches.get(data.matchId).setSong(song);
            });
        }
    }

    NetworkEntity.registerType(ClientMatch, EntityType.Match);
    Connection.ready().then((socket) => {
        socket.get().on(MatchEvent.matchCreated, data => addMatch(data.matchId));
        socket.get().on(MatchEvent.matchListUpdate, parseMatchIds);
        socket.get().on(MatchEvent.matchStarted, triggerMatchStart);
        socket.get().on(MatchEvent.matchEnded, triggerMatchEnd);
        socket.get().on(MatchEvent.setSong, setMatchSong);
    });

    return ClientMatch;
}
