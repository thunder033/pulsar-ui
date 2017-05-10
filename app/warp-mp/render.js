/**
 * Created by gjrwcs on 5/10/2017.
 */
const SliceBar = require('game-params').SliceBar;
const Gem = require('game-params').Gem;

module.exports = {renderFactory,
resolve: ADT => [
    ADT.game.const.UITrack,
    ADT.mallet.Geometry,
    ADT.mallet.Math,
    ADT.mallet.Camera,
    ADT.warp.Level,
    renderFactory]};

/**
 *
 * @param UITrack
 * @param Geometry
 * @param MM
 * @param Camera {Camera}
 * @param Level {Level}
 * @returns {Render}
 */
function renderFactory(UITrack, Geometry, MM, Camera, Level) {
    const meshes = Geometry.meshes;
    const mLanePadding = 0.01; // padding on edge of each lane

    const tLane = new Geometry.Transform()
        .scaleBy(UITrack.LANE_WIDTH - mLanePadding, 1, 150)
        .translate(0, -0.1, 2.3);
    tLane.origin.z = 1;
    const grey = MM.vec3(225, 225, 225);
    let warpDrive = null;

    const tBar = new Geometry.Transform();
    tBar.origin.set(-1, 0, 1);
    const zRot = -Math.PI / 8;

    function getStartOffset() {
        let startOffset = 0;
        const sliceOffset = 2;
        for (let i = 0; i < sliceOffset; i++) {
            startOffset += (warpDrive.getSlice(i).speed * SliceBar.scaleZ + SliceBar.margin) || 0;
        }

        return startOffset;
    }

    function getItems(indices, items) {
        return indices.map(i => items[i]);
    }

    const gems = new Array(Level.barsVisible);
    for (let g = 0; g < gems.length; g++) {
        gems[g] = new Geometry.Transform();
        // gems[g].position.y = -.5;
        gems[g].rotation.y = Math.PI / 4;
        gems[g].rotation.x = Math.PI / 4;
        gems[g].scale = MM.vec3(0.175);
    }

    class Render {
        static setWarpDrive(newDrive) {
            warpDrive = newDrive;
        }

        /**
         * Ramp objects up the side of the lanes
         * @param pos {Vector3}
         * @returns {Vector3}
         */
        static reMapPosition(pos) {
            const rampLBound = UITrack.POSITION_X + UITrack.LANE_WIDTH / 2;
            const rampRBound = UITrack.POSITION_X + UITrack.WIDTH - UITrack.LANE_WIDTH / 2;

            const x = pos.x;
            if (x < rampLBound || x > rampRBound) {
                const flatWidth = UITrack.WIDTH - UITrack.LANE_WIDTH;
                const trackCenter = UITrack.POSITION_X + UITrack.WIDTH / 2;
                const relX = Math.abs(x - trackCenter) - (flatWidth / 2);

                // Beyond the edge of the lanes, the ship will move slower in X
                const contractionFactor = 0.67;
                pos.x = Math.sign(x - trackCenter) * (flatWidth / 2 + relX * contractionFactor);

                const r = UITrack.LANE_WIDTH * 3; // arc radius
                pos.y += 1 + Math.sin((3 / 2) * Math.PI + (relX / r) * Math.PI / 2);
            }

            return pos;
        }

        static drawLanes(camera) {
            tLane.position.x = UITrack.POSITION_X + UITrack.LANE_WIDTH / 2;
            for (let i = 0; i < UITrack.NUM_LANES; i++) {
                camera.render(meshes.XZQuad, tLane, grey);
                tLane.position.x += UITrack.LANE_WIDTH;
            }
            camera.present(); // Draw the background
        }

        static drawGems(dt, tt) {
            // make the first bar yellow
            // ctx.fillStyle = '#ff0';
            let color = MM.vec3(100, 255, 255);

            const barOffset = warpDrive.getBarOffset();
            const sliceIndex = warpDrive.getSliceIndex();

            // this spaces the bars correctly across the screen, based on how far above the plane the camera is
            let drawOffset = getStartOffset();

            const blackGems = [];
            for (let i = 0; i < Level.barsVisible; i++) {
                if (i + 10 > Level.barsVisible) {
                    const sliceValue = 1 - (Level.barsVisible - i) / 10;
                    color = MM.vec3(100 + sliceValue * 110, 255 - sliceValue * 45, 255 - sliceValue * 45);
                }

                const slice = warpDrive.getSlice(i);
                const depth = SliceBar.scaleZ * slice.speed;
                const zOffset = drawOffset - barOffset;

                tBar.scale.x = SliceBar.scaleX * slice.loudness;
                tBar.scale.z = depth;

                // Render the left bar
                tBar.position.set(UITrack.POSITION_X, 0, zOffset);
                tBar.rotation.z = (-Math.PI) - zRot;
                Camera.render(meshes.XZQuad, tBar, color);

                // Render the right bar
                tBar.position.set(UITrack.POSITION_X + UITrack.WIDTH, 0, zOffset);
                tBar.rotation.z = zRot;
                Camera.render(meshes.XZQuad, tBar, color);

                const sliceGems = slice.gems || [];
                gems[i].scale.set(0);

                if ((sliceIndex + i) % 2 === 0) { // only render gems for even indexed slices
                    for (let l = 0; l < UITrack.Field.NUM_LANES; l++) {
                        if (sliceGems[l] === Gem.NONE || sliceGems[l] === Gem.COLLECTED) {
                            continue;
                        }

                        const gemXPos = UITrack.Field.POSITION_X + UITrack.LANE_WIDTH / 2 + UITrack.LANE_WIDTH * l;
                        gems[i].position.set(gemXPos, 0.1, zOffset);
                        Render.reMapPosition(gems[i].position);
                        if (sliceGems[l] === Gem.GREEN) {
                            gems[i].scale.set(0.15);
                            gems[i].rotation.set(0, tt / 1000, 0);
                        } else if (sliceGems[l] === Gem.BLACK) {
                            blackGems.push(i);
                            gems[i].rotation.set(
                                tt / 666,
                                tt / 666,
                                Math.PI / 4);
                        }
                    }
                }

                drawOffset -= depth + SliceBar.margin; // add the width the current bar (each bar has a different width)
            }


            const green = MM.vec3(0, 225, 40);
            Camera.render(meshes.Cube, gems, green);

            const darkGrey = MM.vec3(25);
            const transforms = getItems(blackGems, gems);
            transforms.forEach(t => t.scale.set(0.3));
            Camera.render(meshes.Spike, transforms, darkGrey);

            Camera.present(); // Draw the gems
        }
    }

    return Render;
}
