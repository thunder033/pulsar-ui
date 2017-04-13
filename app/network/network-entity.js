/**
 * Handles synchronizing a given entity with it's server counterpart
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const IOEvent = require('pulsar-lib').EventTypes.IOEvent;
const DataType = require('game-params').DataType;
const getFieldSize = require('game-params').getFieldSize;
const getPrimitiveType = require('game-params').getPrimitiveType;
const DataFormat = require('game-params').DataFormat;
const EventTarget = require('eventtarget');
require('buffer/');

function getFormatSize(format) {
    let size = 0;
    format.forEach((type) => {
        size += getFieldSize(type);
    });
    return size;
}

function getFieldPosition(field, format) {
    let position = 0;
    const it = format.entries();

    let item = it.next();
    while (item.done === false) {
        if(item.value[0] === field) {
            break;
        }

        position += getFieldSize(item.value[1]);
        item = it.next();
    }

    return position;
}

module.exports = {networkEntityFactory,
    resolve: ADT => [
        ADT.network.Connection,
        ADT.ng.$q,
        ADT.ng.$rootScope,
        MDT.Log,
        networkEntityFactory]};

function networkEntityFactory(Connection, $q, $rootScope, Log) {
    /**
     * Manages synchronization for a entity with the server instance
     */
    class NetworkEntity extends EventTarget {

        /**
         *
         * @param id {string}
         * @param [format] {Map}
         */
        constructor(id, format = null) {
            if (!id) {
                throw new ReferenceError('NetworkEntity must be constructed with an ID');
            }
            super();
            this.id = id.id || id;

            if (typeof this.id !== 'string' && typeof this.id !== 'number') {
                throw new TypeError(`${typeof this.id} is not valid a valid Network ID type. Must be string or number.`);
            }

            this.syncTime = 0;
            this.format = format;

            if (format instanceof Map) {
                this.parseFieldSizes();
                this.buffer = Buffer.alloc(getFormatSize(DataFormat.NETWORK_ENTITY) + getFormatSize(format));
                this.syncOps = [];

                // Bind a method for retrieving the timestamp from the buffer
                const tsReadMethod = NetworkEntity.readMethods.get(DataType.Double);
                const tsPosition = getFieldPosition('timestamp', DataFormat.NETWORK_ENTITY);
                this.getTimeStamp = this.buffer[tsReadMethod].bind(this.buffer, tsPosition);

                // Bind methods for setting each field from the buffer
                let position = NetworkEntity.entityOffset;
                format.forEach((type, field) => {
                    const primitiveType = getPrimitiveType(type);
                    const size = this.sizes[field];

                    if(isNaN(size)) {
                        throw new Error(`Failed to read size for field ${field}`);
                    }

                    // Strings are read with different arguments than other types, so handle them separately
                    if (primitiveType === DataType.String) {
                        const method = this.buffer.toString.bind(this.buffer, 'utf8', position, position + size);
                        this.syncOps.push(((m, f) => {
                            return () => this[f] = m();
                        })(method, field));
                    } else {
                        const method = NetworkEntity.readMethods.get(primitiveType);
                        this.syncOps.push(((p, m, f) => {
                            return () => this[f] = this.buffer[m](p);
                        })(position, method, field));
                    }

                    position += size;
                });
            }

            NetworkEntity.putEntity(this.getType(), this);
        }

        getType() {
            return this.constructor;
        }

        getId() {
            return this.id;
        }

        /**
         * Set all values in a response on the entity
         * @param params {Object|ArrayBuffer}
         * @param view {Uint8Array}
         * @param storeValuesCB {Function}
         */
        sync(params, view, storeValuesCB) {
            if(params instanceof ArrayBuffer) {
                if(!(this.format instanceof Map)) {
                    const type = NetworkEntity.getName(this.getType());
                    throw new ReferenceError(`${type} cannot sync a binary response without a format set`);
                }

                this.buffer.set(view.subarray(0, this.buffer.length));
                const timeStamp = this.getTimeStamp();

                // throw out the update if it's older than anything we already got
                if (timeStamp <= this.syncTime) {
                    return;
                }

                this.syncTime = timeStamp;

                // allow the entity to store any values it will need after the update
                if(storeValuesCB instanceof Function) {
                    storeValuesCB();
                }

                const l = this.syncOps.length;
                for (let i = 0; i < l; i++) {
                    this.syncOps[i]();
                }
            } else {
                Object.assign(this, params);
                this.syncTime = ~~performance.now();

                Log.debug(`sync ${this.constructor.name} ${this.id} at ${this.syncTime}`);
                $rootScope.$evalAsync();
            }
        }

        requestSync() {
            const typeName = NetworkEntity.getName(this.getType());
            const serverType = NetworkEntity.getName(NetworkEntity.getLookupType(typeName));
            const request = Connection.getSocket()
                .request(IOEvent.syncNetworkEntity, {type: serverType, id: this.getId()})
                .then(NetworkEntity.reconstruct);
            NetworkEntity.pendingRequests.set(this.getId(), request);

            return request;
        }

        parseFieldSizes() {
            const sizes = {};
            this.format.forEach((type, field) => {
                sizes[field] = getFieldSize(type);
            });

            this.sizes = sizes;
        }

        static putEntity(type, entity) {
            const lookupType = NetworkEntity.getLookupType(NetworkEntity.getName(type));
            Log.verbose(`Put entity ${NetworkEntity.getName(lookupType)} ${entity.getId()}`);
            NetworkEntity.entities.get(NetworkEntity.getName(lookupType)).set(entity.getId(), entity);
        }

        static getName(type) {
            return this.typeNames.get(type);
        }

        static registerType(type, name) {
            let baseType = type;

            // determine if the new type is derived from an existing type
            // inherited types are indexed by their base type
            NetworkEntity.lookupTypes.forEach((candidateType) => {
                if (type.prototype instanceof candidateType) {
                    baseType = candidateType;
                }
            });

            NetworkEntity.typeNames.set(type, name);
            NetworkEntity.constructorTypes.set(name, type);
            NetworkEntity.lookupTypes.set(name, baseType);
            Log.debug(`Register NetworkEntity type ${NetworkEntity.getName(type)} [as ${NetworkEntity.getName(baseType)}]`);
            if (baseType === type) {
                Log.verbose(`Create NetworkEntity index ${NetworkEntity.getName(type)}`);
                NetworkEntity.entities.set(name, new Map());
            }
        }

        static getConstructorType(typeName) {
            let resolvedType = typeName;
            if (NetworkEntity.constructorTypes.has(typeName) === false) {
                if (NetworkEntity.constructorTypes.has(`Client${typeName}`)) {
                    resolvedType = `Client${typeName}`;
                } else {
                    throw new ReferenceError(`Type ${typeName} is not a valid network entity constructor type`);
                }
            }

            return NetworkEntity.constructorTypes.get(resolvedType);
        }

        /**
         * Retrieve a network entity constructor based on name
         * @param typeName
         * @returns {V}
         */
        static getLookupType(typeName) {
            let resolvedType = typeName;
            if (NetworkEntity.lookupTypes.has(typeName) === false) {
                if (NetworkEntity.lookupTypes.has(`Client${typeName}`)) {
                    resolvedType = `Client${typeName}`;
                } else {
                    throw new ReferenceError(`Type ${typeName} is not a valid network entity lookup type`);
                }
            }

            return NetworkEntity.lookupTypes.get(resolvedType);
        }

        /**
         * Returns a network entity identified by type and id
         * @param type {class}
         * @param id {string}
         * @returns {Promise<NetworkEntity>}
         */
        static getById(type, id) {
            if (!type || typeof id !== 'string') {
                throw new Error('Network entities must be identified by both type and name.');
            }

            const lookupType = NetworkEntity.getLookupType(NetworkEntity.getName(type));
            const typeName = NetworkEntity.getName(lookupType);

            if (NetworkEntity.localEntityExists(lookupType, id) === true) {
                // console.log('use local copy ', id);
                return $q.when(NetworkEntity.entities.get(typeName).get(id));
            } else if (NetworkEntity.pendingRequests.has(typeName + id)) {
                Log.debug('use pending ', id);
                return NetworkEntity.pendingRequests.get(typeName + id);
            }

            const serverType = NetworkEntity.getName(type);
            Log.debug(`request ${serverType} ${id}`);
            const request = Connection.getSocket()
                .request(IOEvent.syncNetworkEntity, {type: serverType, id})
                .then(NetworkEntity.reconstruct);
            NetworkEntity.pendingRequests.set(id, request);
            return request;
        }

        /**
         * Indicates if the entity identified by the registered type and name exists locally
         * @param type {Function}
         * @param id {string}
         * @return {boolean}
         */
        static localEntityExists(type, id) {
            const typeName = NetworkEntity.getName(type);
            Log.verbose(`check ${typeName} ${id} exists`);
            try {
                return NetworkEntity.entities.get(typeName).has(id);
            } catch (e) {
                if (NetworkEntity.getLookupType(typeName)) {
                    throw new Error(`Could not complete look up: ${e.message || e}`);
                } else {
                    throw e;
                    // return false;
                }
            }
        }

        /**
         * Syncs the values of a map to the given array
         * @param map {Map}
         * @param arr {Array}
         */
        static syncValueList(map, arr) {
            /* eslint no-param-reassign: off */
            arr.length = 0;
            const it = map.values();
            let item = it.next();
            while (item.done === false) {
                arr.push(item.value);
                item = it.next();
            }

            $rootScope.$evalAsync();
        }

        /**
         * Parses a response to rebuild a network entity
         * @param data
         * @returns {Promise<NetworkEntity>}
         */
        static reconstruct(data) {
            let syncParams = null;
            let entity = null;
            let id = '';
            let serverTypeCode;
            let view = null;

            if(data instanceof ArrayBuffer) {
                view = new Uint8Array(data);
                id = String.fromCharCode.apply(null, view.subarray(0, NetworkEntity.ID_LENGTH));
                serverTypeCode = view[NetworkEntity.ID_LENGTH];
                syncParams = data;
            } else {
                id = data.id;
                serverTypeCode = data.type;
                syncParams = data.params;
            }

            const type = NetworkEntity.getLookupType(serverTypeCode);
            const typeName = NetworkEntity.getName(type);

            Log.verbose(`Resolved ${serverTypeCode} to ${typeName}`);
            if (NetworkEntity.localEntityExists(type, id) === true) {
                entity = NetworkEntity.entities.get(typeName).get(id);
            } else {
                Log.debug('construct ', id);
                const ctorType = NetworkEntity.getConstructorType(serverTypeCode);
                /* eslint new-cap: off */
                entity = new ctorType(syncParams, id);
            }


            if (NetworkEntity.pendingRequests.has(typeName + entity.id)) {
                NetworkEntity.pendingRequests.delete(typeName + entity.id);
            }

            return $q.when(entity.sync(syncParams, view)).then(() => entity);
        }
    }

    NetworkEntity.lookupTypes      = new Map(); // Mapping of types to use for entity look ups
    NetworkEntity.constructorTypes = new Map(); // Types to use when reconstructing entities
    NetworkEntity.entities         = new Map(); // Collection of all synced entities
    NetworkEntity.pendingRequests  = new Map(); // Map of pending sync requests
    NetworkEntity.typeNames        = new Map(); // Type names are minified so we have to look up references

    NetworkEntity.ID_LENGTH = 36;

    NetworkEntity.utf8Decoder = new TextDecoder('utf-8');
    NetworkEntity.entityOffset = getFormatSize(DataFormat.NETWORK_ENTITY);

    NetworkEntity.readMethods = new Map([
        [DataType.Float, 'readFloatBE'],
        [DataType.Double, 'readDoubleBE'],
        [DataType.Int8, 'readInt8'],
        [DataType.Int16, 'readInt16BE'],
        [DataType.Int32, 'readInt32BE'],
    ]);

    Connection.ready().then((socket) => {
        socket.get().on(IOEvent.syncNetworkEntity, NetworkEntity.reconstruct);
    });

    return NetworkEntity;
}
