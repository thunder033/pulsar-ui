/**
 * Created by gjr8050 on 3/27/2017.
 */

const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;
const DriveParams = require('game-params').DriveParams;
const MDT = require('../mallet/mallet.dependency-tree').MDT;

module.exports =  {warpDriveFactory,
resolve: ADT => [
    ADT.game.LerpedEntity,
    ADT.network.NetworkEntity,
    ADT.warp.Bar,
    warpDriveFactory]};

function warpDriveFactory(LerpedEntity, NetworkEntity, Bar) {
    const EMPTY_SLICE = {speed: 1, loudness: 0, gems: [0, 0, 0]};

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
            this.velocity = 0;
        }

        load(warpField) {
            if (warpField === null) {
                return null;
            }

            this.warpField = warpField;
            this.level = warpField.getLevel();
        }

        sync(buffer, view) {
            super.sync(buffer, view, () => {
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
            }
        }

        getSliceIndex() {
            return this.curSliceIndex;
        }

        getBarOffset() {
            return this.curBarOffset;
        }

        /**
         * Get slice at offset from current index
         * @param offset
         * @returns {{speed, loudness, gems}}
         */
        getSlice(offset = 0) {
            const index = this.curSliceIndex + offset;
            if(index < this.level.length && index >= 0) {
                return this.level[index];
            } else {
                return EMPTY_SLICE;
            }
        }

        update(dt) {
            if(this.warpField === null) {
                return;
            }

            super.update(dt);

            if(this.lerpPct > this.sliceEndPct && this.curSliceIndex === this.prevSliceIndex) {
                this.curSliceIndex = this.sliceIndex;
                this.curBarOffset = 0;
                const sliceSpeed = this.getSlice(DriveParams.RENDER_OFFSER).speed;
                this.velocity = (sliceSpeed * Bar.scale.z + Bar.margin) / this.warpField.getTimeStep();
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