/**
 * Maintains state of the user's connection to the server
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const IOEvent = require('pulsar-lib').EventTypes.IOEvent;
const EntityType = require('entity-types').EntityType;

module.exports = {userFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    ADT.network.Connection,
    userFactory]};

function userFactory(NetworkEntity, Connection) {
    /**
     * Yes this looks stupid as hell...
     */
    class ClientClient extends NetworkEntity {

        constructor(params) {
            super(params.id);
            this.name = params.name;
        }

        getName() {
            return this.name;
        }
    }

    NetworkEntity.registerType(ClientClient, EntityType.Client);
    Connection.addEventListener(IOEvent.joinServer, (e) => {
        // Assign a local user entity to the client connection on join
        Connection.deferReady(NetworkEntity.getById(ClientClient, e.userId).then((user) => {
            Connection.user = user;
        }));
    });

    return ClientClient;
}
