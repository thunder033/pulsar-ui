/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const IOEvent = require('pulsar-lib').EventTypes.IOEvent;

module.exports = {connectionFactory,
resolve: ADT => [
    ADT.ng.$q,
    ADT.network.Socket,
    ADT.network.AsyncInitializer,
    ADT.network.Clock,
    ADT.shared.Status,
    connectionFactory]};

/**
 * Provides a connection entity
 * @param $q
 * @param Socket
 * @param AsyncInitializer
 * @param Clock {Clock}
 * @param Status
 * @returns {ClientConnection}
 */
function connectionFactory($q, Socket, AsyncInitializer, Clock, Status) {
    const deferConnected = $q.defer();
    const deferJoined = $q.defer();

    /**
     * Maintains a connection to the server
     */
    class ClientConnection extends AsyncInitializer {

        constructor() {
            const joinEvt = new Event(IOEvent.joinServer);
            const joined = deferJoined.promise.then((data) => {
                joinEvt.userId = data.userId;
                this.timeDifference = Clock.getNow() - parseFloat(data.serverTime) || 0;
                this.dispatchEvent(joinEvt);
            });

            super([deferConnected.promise, joined]);
            this.user         = null;
            this.ping         = NaN;
            this.pingInterval = null;
            this.pingIntervalTime = 1000;

            this.pingBuffer = new ArrayBuffer(64);
            this.pingView = new DataView(this.pingBuffer);

            this.timeDifference = 0;
        }

        pong(timestamp) {
            this.socket.get().emit(IOEvent.serverPong, timestamp);
        }

        sendPing() {
            this.pingView.setFloat64(0, Clock.getNow());
            this.socket.get().emit(IOEvent.clientPing, this.pingBuffer);
        }

        calculatePing(buffer) {
            if (buffer instanceof ArrayBuffer) {
                const timestamp = new DataView(buffer).getFloat64(0);
                this.ping = Clock.getNow() - timestamp;
            }
        }

        getTimeDifference() {
            return this.timeDifference;
        }

        getPing() {
            return this.ping;
        }

        onDisconnect() {
            Status.displayConditional('Disconnected from Server...', 'error');
            const disconnectEvt = new Event(IOEvent.disconnect);
            this.dispatchEvent(disconnectEvt);
        }

        onReconnect() {
            const reconnectEvt = new Event(IOEvent.reconnect);
            this.dispatchEvent(reconnectEvt);
            Status.display('Connected!');
        }

        /**
         * Authenticates with the given credentials and retrieves the user
         * @param credentials
         */
        authenticate(credentials) {
            this.socket = new Socket(credentials);

            // Set up events
            this.socket.get().on(IOEvent.connect, deferConnected.resolve);
            this.socket.get().on(IOEvent.joinServer, deferJoined.resolve);
            this.socket.get().on(IOEvent.disconnect, () => this.onDisconnect());
            this.socket.get().on(IOEvent.reconnect, () => this.onReconnect());

            this.socket.get().on(IOEvent.serverPing, timestamp => this.pong(timestamp));
            this.socket.get().on(IOEvent.clientPong, timestamp => this.calculatePing(timestamp));

            return this.ready().then(() => {
                this.pingInterval = setInterval(() => this.sendPing(), this.pingIntervalTime);
                return this.user;
            });
        }

        getSocket() {
            if (this.socket === null) {
                throw new Error('Cannot access connection before authentication');
            }

            return this.socket;
        }

        getUser() {
            return this.user;
        }
    }

    return new ClientConnection();
}
