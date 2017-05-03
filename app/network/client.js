/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const MDT = require('../mallet/mallet.dependency-tree').MDT;
const IOEvent = require('pulsar-lib').EventTypes.IOEvent;
const MatchEvent = require('pulsar-lib').EventTypes.MatchEvent;
const GameEvent = require('event-types').GameEvent;

module.exports = {clientFactory,
resolve: ADT => [
    ADT.network.Connection,
    ADT.ng.$rootScope,
    ADT.network.AsyncInitializer,
    MDT.Log,
    ADT.shared.Status,
    clientFactory]};

function clientFactory(Connection, $rootScope, AsyncInitializer, Log, Status) {
    class Client extends AsyncInitializer {

        constructor() {
            super();
            this.user = null;
            this.connection = Connection;
            const forward = this.forwardClientEvent.bind(this);

            [ // Forward Client Events
                IOEvent.joinedRoom,
                IOEvent.leftRoom,
                MatchEvent.matchStarted,
                MatchEvent.matchEnded,
                GameEvent.clientsReady,
                GameEvent.pause,
                GameEvent.resume,
            ].forEach(e => $rootScope.$on(e, forward));

            $rootScope.$on(IOEvent.joinedRoom, (e, args) => this.onRoomJoin(e, args));
            $rootScope.$on(IOEvent.leftRoom, (e, args) => this.onLeftRoom(e, args));
        }

        onRoomJoin(e, args) {
            if (args.room.contains(this.user) && args.user !== this.user) {
                Status.display(`${args.user.getName()} joined ${args.room.getLabel()}`);
            }
        }

        onLeftRoom(e, args) {
            if (args.room.contains(this.user) && args.user !== this.user) {
                Status.display(`${args.user.getName()} left ${args.room.getLabel()}`);
            }
        }

        getUser() {
            return this.user;
        }

        emit(name, data) {
            this.connection.getSocket().get().emit(name, data);
        }

        forwardClientEvent(evt, args) {
            Log.out('client recieved evt ', evt.name);
            if ((args.user && args.user === this.user) || args.clientEvent === true) {
                const e = new Event(evt.name);
                Object.assign(e, args);
                this.dispatchEvent(e);
            }
        }

        authenticate(credentials) {
            return Connection.authenticate(credentials).then((user) => {
                this.user = user;
                this.emit(IOEvent.joinServer);
                return user;
            });
        }
    }

    return new Client();
}
