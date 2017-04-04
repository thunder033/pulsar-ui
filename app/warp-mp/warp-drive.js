/**
 * Created by gjr8050 on 3/27/2017.
 */

const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;
const MDT = require('../mallet/mallet.dependency-tree').MDT;

module.exports =  {warpDriveFactory,
resolve: ADT => [
    ADT.game.LerpedEntity,
    ADT.network.NetworkEntity,
    ADT.warp.Bar,
    warpDriveFactory]};

function warpDriveFactory(LerpedEntity, NetworkEntity, Bar) {

    class WarpDrive extends LerpedEntity {
        constructor(params, id) {
            super(id, DataFormat.WARP_DRIVE);

            this.sliceIndex = 0;
            this.barOffset = 0;

            this.prevSliceIndex = 0;
            this.prevBarOffset = 0;

            this.sliceIndexDelta = 0;
            this.barOffsetDelta = 0;

            this.sliceEndPct = 0;

            this.curSliceIndex = 0;
            this.curBarOffset = 0;

            this.warpField = null;
            this.level = [];
        }

        load(warpField) {
            this.warpField = warpField;
            this.level = warpField.getLevel();
            this.velocity = (0.95 * Bar.scale.z + Bar.margin) / this.warpField.getTimeStep();
            console.log(this.level);
        }

        sync(buffer, bufferString) {
            super.sync(buffer, bufferString, () => {
                this.prevBarOffset = this.barOffset;
                this.prevSliceIndex = this.sliceIndex;
            });

            this.sliceIndexDelta = this.sliceIndex - this.prevSliceIndex;
            this.curBarOffset = this.prevBarOffset;
            this.curSliceIndex = this.prevSliceIndex;
            this.sliceEndPct = NaN;

            // were assuming there can only be a slice index change of 1
            if(this.sliceIndexDelta > 0) {
                const switchTime = Math.abs(this.barOffset / this.velocity); //this.level[this.sliceIndex].speed;
                this.sliceEndPct = (this.syncElapsed - switchTime) / this.syncElapsed;
                console.log(this.level[this.sliceIndex]);
            }
        }

        getSliceIndex() {
            return this.curSliceIndex;
        }

        getBarOffset() {
            return this.curBarOffset;
        }

        update(dt) {
            super.update(dt);

            if(this.lerpPct > this.sliceEndPct && this.curSliceIndex === this.prevSliceIndex) {
                this.curSliceIndex = this.sliceIndex;
                this.curBarOffset = 0;
            }

            if(!this.level.length) {
                return;
            }

            this.curBarOffset -= this.velocity * dt;
        }
    }

    NetworkEntity.registerType(WarpDrive, EntityType.WarpDrive);

    return WarpDrive;
}