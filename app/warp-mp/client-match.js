'use strict';
/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const MatchEvent = require('event-types').MatchEvent;
const EntityType = require('entity-types').EntityType;

module.exports = {matchFactory,
resolve: ADT => [
    ADT.network.Connection,
    ADT.network.ClientRoom,
    ADT.network.User,
    ADT.network.NetworkEntity,
    ADT.ng.$rootScope,
    ADT.media.IPlayable,
    ADT.game.MatchLoader,
    matchFactory]};

function matchFactory(Connection, ClientRoom, User, NetworkEntity, $rootScope, IPlayable, MatchLoader) {
    const matches = new Map();
    const matchList = [];

    class ClientMatch extends ClientRoom {

        constructor(params) {
            super(params);
            this.host = null;
            this.song = null;
            this.started = false;
            this.startTime = NaN;
        }

        sync(data) {
            NetworkEntity.getById(User, data.host).then(user => this.host = user);
            delete data.host;
            super.sync(data);
        }

        setSong(song) {
            this.song = song;
        }

        getSong() {
            return this.song;
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

        onStart(startTime, gameId) {
            this.started = true;
            this.startTime = startTime;
            updateMatchList();
            $rootScope.$broadcast(MatchEvent.matchStarted, {match: this, gameId, clientEvent: true});
        }

        onEnd() {
            $rootScope.$broadcast(MatchEvent.matchEnded, {match: this, clientEvent: true});
        }

        getStartTime() {
            return this.startTime + Connection.getTimeDifference();
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
        matches.get(data.matchId).onStart(data.startTime, data.gameId);
    }

    function triggerMatchEnd(data) {
        matches.get(data.matchId).onEnd();
    }

    function setMatchSong(data) {
        MatchLoader.reconstructSong(data.song).then((song) => {
            console.log(song);
            matches.get(data.matchId).setSong(song);
        });
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
