/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const EntityType = require('entity-types').EntityType;

module.exports = {warpFieldFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    warpFieldFactory]};

function warpFieldFactory(NetworkEntity) {

    class WarpField extends NetworkEntity {
        constructor(params) {
            super(params.id);
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
            delete params.version;
            super.sync(params);
        }
    }

    NetworkEntity.registerType(WarpField, EntityType.WarpField);

    return WarpField;
}