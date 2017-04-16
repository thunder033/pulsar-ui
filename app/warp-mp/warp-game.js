/**
 * Created by gjr8050 on 3/10/2017.
 */

const EntityType = require('entity-types').EntityType;
const GameEvent = require('event-types').GameEvent;
module.exports = {warpGameFactory,
resolve: ADT => [
    ADT.game.Player,
    ADT.network.NetworkEntity,
    ADT.game.ClientShip,
    ADT.network.User,
    ADT.ng.$q,
    ADT.network.ClientRoom,
    ADT.game.WarpField,
    ADT.game.WarpDrive,
    ADT.network.Connection,
    ADT.ng.$rootScope,
    warpGameFactory]};

function warpGameFactory(Player, NetworkEntity, ClientShip, User, $q, ClientRoom, WarpField, WarpDrive, Connection, $rootScope) {
    const utf8Decoder = new TextDecoder('utf-8');
    function createPlayers(buffer, match) {
        const players = [];

        const view = new DataView(buffer);
        const bufferString = utf8Decoder.decode(view);

        for (let i = 0; i * NetworkEntity.ID_LENGTH < bufferString.length; i += 2) {
            const userId = bufferString.substr(i * NetworkEntity.ID_LENGTH, NetworkEntity.ID_LENGTH);
            const shipId = bufferString.substr((i + 1) * NetworkEntity.ID_LENGTH, NetworkEntity.ID_LENGTH);
            console.log(`create player for ship ${shipId} and user ${userId}`);
            players.push($q.all([
                // Resolve the entities associated with the player
                NetworkEntity.getById(User, userId),
                NetworkEntity.getById(ClientShip, shipId),
                // jshint -W083: false
            ]).spread((user, ship) => {
                const player = new Player(user, match, ship);
                // The player is identified by the user id, so get player data from the server
                return player.requestSync();
            }));
        }

        return $q.all(players);
    }

    /**
     * @type WarpGame
     */
    class ClientSimulation extends NetworkEntity {
        /**
         * @constructor
         */
        constructor(params) {
            super(params.id);
            this.match = null;
            this.players = [];
            this.warpField = null;
            this.warpDrive = null;
        }

        /**
         * @param params {{matchId, shipIds}}
         * @returns {*}
         */
        sync(params) {
            const getMatch = NetworkEntity.getById(ClientRoom, params.matchId);
            // The warp field might be undefined, just return null
            const getWarpField = NetworkEntity.getById(WarpField, params.warpFieldId).catch(e => null);
            const getWarpDrive = NetworkEntity.getById(WarpDrive, params.warpDriveId);

            return $q.all([getMatch, getWarpField, getWarpDrive]).spread((match, warpField, warpDrive) => {
                this.match = match;
                this.warpField = warpField;
                this.warpDrive = warpDrive;
                this.warpDrive.load(this.warpField);

                if (this.players.length === 0) {
                    return createPlayers(params.shipIds, match).then((players) => { this.players = players; });
                }
            }).finally(() => {
                delete params.matchId;
                delete params.shipIds;
                super.sync(params);
            });
        }

        onClientsReady(startTime) {
            this.startTime = startTime;
            $rootScope.$broadcast(GameEvent.clientsReady, {clientEvent: true});
        }

        getWarpDrive() {
            return this.warpDrive;
        }

        getWarpField() {
            return this.warpField;
        }

        getPlayers() {
            return this.players;
        }

        getMatch() {
            return this.match;
        }

        getStartTime() {
            return this.startTime + Connection.getTimeDifference();
        }
    }

    function onGameClientsReady(data) {
        NetworkEntity.getById(ClientSimulation, data.gameId)
            .then(game => game.onClientsReady(data.startTime));
    }

    Connection.ready().then((socket) => {
        socket.get().on(GameEvent.clientsReady, onGameClientsReady);
    });

    NetworkEntity.registerType(ClientSimulation, EntityType.Simulation);

    return ClientSimulation;
}
