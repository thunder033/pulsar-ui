/**
 * Created by Greg on 11/27/2016.
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
require('angular')
    .module('pulsar.warp')
    .service('warp.WarpFieldDraw', [
        MDT.Scheduler,
        'warp.Level',
        MDT.Math,
        'warp.State',
        MDT.Camera,
        MDT.Geometry,
        'warp.Bar',
        MDT.Easel,
        '$timeout',
        WarpFieldDraw,
    ]);

function WarpFieldDraw(MScheduler, WarpLevel, MM, WarpState, MCamera, Geometry, Bar, MEasel, $timeout) {
    const velocity = 0;
    const sliceOffset = 3; // how many slice to draw behind the ship (that have already passed)
    const meshes = Geometry.meshes;
    const Transform = Geometry.Transform;

    const mLaneWidth = 0.20; // width of each lane
    const mLanePadding = 0.01; // padding on edge of each lane

    const tLane = new Transform()
        .scaleBy(mLaneWidth - mLanePadding, 1, 60)
        .translate(0, -0.1, -37);
    tLane.origin.z = -0.5;

    const tZero = new Transform();
    tZero.scale.x = mLaneWidth * 3;
    tZero.position = MM.vec3(0, -0.1, 6);

    const gems = new Array(WarpLevel.barsVisible);
    for (let g = 0; g < gems.length; g++) {
        gems[g] = new Transform();
        // gems[g].position.y = -.5;
        gems[g].rotation.y = Math.PI / 4;
        gems[g].rotation.x = Math.PI / 4;
        gems[g].scale = MM.vec3(0.15);
    }

    const tBar = new Transform();
    tBar.origin.x = -1;
    tBar.origin.z = 1;

    function getStartOffset(barBuffer) {
        let startOffset = 6;
        for (let i = 0; i < sliceOffset; i++) {
            startOffset += barBuffer[i].speed * Bar.scale.z + Bar.margin;
        }

        return startOffset;
    }

    function getItems(indices, items) {
        return indices.map(i => items[i]);
    }

    function draw(dt, tt) {
        const zRot = -Math.PI / 8; // rotation of loudness bars on the edges

        WarpLevel.barOffset += velocity * dt;
        // make the first bar yellow
        // ctx.fillStyle = '#ff0';
        let color = MM.vec3(100, 255, 255);

        // this spaces the bars correctly across the screen, based on how far above the plane the camera is
        let drawOffset = getStartOffset(WarpLevel.barQueue);

        const blackGems = [];
        for (let i = 0; i < WarpLevel.barsVisible; i++) {
            if (i + 10 > WarpLevel.barsVisible) {
                const sliceValue = 1 - (WarpLevel.barsVisible - i) / 10;
                color = MM.vec3(100 + sliceValue * 110, 255 - sliceValue * 45, 255 - sliceValue * 45);
            }

            const depth = Bar.scale.z * WarpLevel.barQueue[i].speed;
            const zOffset = drawOffset - WarpLevel.barOffset;

            tBar.scale.x = Bar.scale.x * WarpLevel.getLoudness(i);
            tBar.scale.z = depth;

            tBar.position = MM.vec3(-mLaneWidth, 0, zOffset);
            tBar.rotation.z = (-Math.PI) - zRot;
            MCamera.render(meshes.XZQuad, tBar, color);

            tBar.position = MM.vec3(mLaneWidth, 0, zOffset);
            tBar.rotation.z = zRot;
            MCamera.render(meshes.XZQuad, tBar, color);

            const sliceGems = (WarpLevel.warpField[WarpLevel.sliceIndex + i] || {}).gems || [];
            gems[i].scale.set(0);

            if ((WarpLevel.sliceIndex + i) % 2 === 0) {
                for (let l = 0; l < 3; l++) {
                    if (sliceGems[l] === 0 || sliceGems[l] === 2) {
                        continue;
                    }

                    gems[i].position.set((l - 1) * mLaneWidth * 3, -0.5, zOffset);
                    if (sliceGems[l] === 1) {
                        gems[i].scale.set(0.15);
                        gems[i].rotation.set(0, tt / 1000, 0);
                    } else if (sliceGems[l] === 3) {
                        blackGems.push(i);
                        gems[i].rotation.set(
                            tt / 666,
                            tt / 666,
                            Math.PI / 4);
                    }
                }
            }

            drawOffset -= depth + Bar.margin; // add the width the current bar (each bar has a different width)
        }

        tLane.position.x = -mLaneWidth;
        const grey = MM.vec3(225, 225, 225);
        MCamera.render(meshes.XZQuad, tLane, grey);
        tLane.position.x = 0;
        MCamera.render(meshes.XZQuad, tLane, grey);
        tLane.position.x = mLaneWidth;
        MCamera.render(meshes.XZQuad, tLane, grey);

        // MCamera.render(meshes.XZQuad, tZero, MM.vec3(255,0,0));

        MCamera.present(); // Draw the background

        const green = MM.vec3(0, 225, 40);
        MCamera.render(meshes.Cube, gems, green);

        const darkGrey = MM.vec3(25);
        const transforms = getItems(blackGems, gems);
        transforms.forEach(t => t.scale.set(0.3));
        MCamera.render(meshes.Spike, transforms, darkGrey);

        MCamera.present(); // Draw the background
    }

    this.init = () => {
        $timeout(() => {
            MEasel.context.canvas.style.backgroundImage = 'radial-gradient(#b2b2b2, #000)';
        });

        MScheduler.schedule(() => {
            if (WarpState.current !== WarpState.Playing) {
                return;
            }

            MScheduler.draw(draw, 9);
        });
    };
}
