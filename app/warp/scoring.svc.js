/**
* Created by gjr8050 on 11/11/2016.
*/
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular').module('pulsar.warp').service('warp.Scoring', [
    'warp.Ship',
    'warp.ShipEffects',
    'warp.Level',
    MDT.Scheduler,
    'warp.State',
    Scoring]);

function Scoring(Ship, ShipEffects, Level, MScheduler, State) {
    const self = this;

    this.score = 0;
    this.multiplier = 1;

    let lastCollectedLane = 0;
    let multiplerStartSlice = 0;
    let lastCollectedSlice = 0;

    State.onState(State.Loading, () => { self.score = 0; });

    MScheduler.schedule(() => {
        const collectOffset = 5; // how many slices ahead of the current slice we're collecting from
        const collectSliceIndex = collectOffset + Level.sliceIndex;
        const currentLane = Ship.getLaneFromPos();

        // Only collect from even slices (gems are only rendered on even slices)
        if (Level.sliceIndex % 2 === 1 && Level.warpField && Level.warpField[collectSliceIndex]) {
            Level.warpField[collectSliceIndex].gems.forEach((gem, lane) => {
                // Preserve the multipiler the player has if they avoid a black gem
                if (Level.sliceIndex - lastCollectedSlice === 2 && gem === 3) {
                    lastCollectedSlice = Level.sliceIndex;
                }

                if (lane !== currentLane) {
                    return;
                }

                if (gem === 1) {
                    self.score += self.multiplier;

                    if (Level.sliceIndex - lastCollectedSlice === 2) {
                        if (Level.sliceIndex - multiplerStartSlice > 10) {
                            self.multiplier += lastCollectedLane !== lane ? 0.3 : 0.05;
                        }
                    } else {
                        multiplerStartSlice = Level.sliceIndex;
                        self.multiplier = Math.min(1, self.multiplier);
                    }

                    ShipEffects.emitCollectionBurst();
                    lastCollectedLane = lane;
                    lastCollectedSlice = Level.sliceIndex;
                } else if (gem === 3) {
                    self.multiplier = 0;
                    multiplerStartSlice = Level.sliceIndex;
                    ShipEffects.emitBlackShardBurst();
                }

                Level.warpField[collectSliceIndex].gems[lane] = 2;
            });
        }
    }, Ship.priority + 1); // Execute after ship update
}
