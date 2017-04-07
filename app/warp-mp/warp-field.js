/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const EntityType = require('entity-types').EntityType;
const DataFormat = require('game-params').DataFormat;
const ByteSizes = require('game-params').ByteSizes;
const Track = require('game-params').Track;

module.exports = {warpFieldFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    warpFieldFactory]};

function warpFieldFactory(NetworkEntity) {

    class WarpField extends NetworkEntity {
        constructor(params) {
            super(params.id, DataFormat.SLICE_UPDATE);
            //Defining a version as a key so that the 'signature' of the object
            //can be compared without analyzing any specific property
            Object.defineProperty(this, params.version, {configurable: false, value: 1, enumerable: true});
            this.duration = 0;
            this.timeStep = NaN;
            this.level = null;
        }

        getLevel() {
            return this.level;
        }

        getTimeStep() {
            return this.timeStep;
        }

        sync(params) {
            if(params instanceof ArrayBuffer) {
                const view = new DataView(params);

                // We would normally check for a timestamp here, but we don't care because a slice will
                // only ever be updated in irreversible manner

                let position = NetworkEntity.entityOffset + this.sizes.timestamp;
                const sliceIndexMethod = NetworkEntity.readMethods.get(this.format.get('sliceIndex'));
                const sliceIndex = view[sliceIndexMethod](position);
                position += this.sizes[sliceIndex];
                
                const gemMethod = NetworkEntity.readMethods.get(this.format.get('gems')[0]);
                const gemSize = ByteSizes.get(this.format.get('gems')[0]);
                for (let i = 0; i < Track.NUM_LANES; i++) {
                    this.level[sliceIndex].gems[i] = view[gemMethod](position);
                    position += gemSize;
                }
            } else {
                delete params.version;
                super.sync(params);
            }
        }
    }

    NetworkEntity.registerType(WarpField, EntityType.WarpField);

    return WarpField;
}