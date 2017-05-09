/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const GameEvent = require('event-types').GameEvent;
const SliceBar = require('game-params').SliceBar;
const DriveParams = require('game-params').DriveParams;

module.exports = {WarpCtrl,
resolve: ADT => [
    ADT.ng.$scope,
    ADT.mallet.Scheduler,
    ADT.mallet.Camera,
    ADT.mallet.Geometry,
    ADT.mallet.Math,
    ADT.mallet.Keyboard,
    ADT.mallet.const.Keys,
    ADT.warp.Level,
    ADT.warp.State,
    ADT.mallet.Color,
    ADT.audio.Player,
    ADT.game.const.UITrack,
    ADT.mallet.State,
    WarpCtrl]};

/* eslint-disable */
/**
 * @param $scope
 * @param MScheduler
 * @param Camera {Camera}
 * @param Geometry
 * @param MM
 * @param Keyboard
 * @param Keys
 * @param Level {Level}
 * @param State
 * @param Color
 * @param Player
 * @param UITrack
 * @param MState
 * @constructor
 */
function WarpCtrl($scope, MScheduler, Camera, Geometry, MM, Keyboard, Keys, Level, State, Color, Player, UITrack, MState) {
    /* eslint-enable */
    $scope.player = Player;

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

    function drawLanes(camera) {
        tLane.position.x = UITrack.POSITION_X + UITrack.LANE_WIDTH / 2;
        for (let i = 0; i < UITrack.NUM_LANES; i++) {
            camera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x += UITrack.LANE_WIDTH;
        }
        camera.present(); // Draw the background
    }

    function processCameraInput(dt) {
        if (!MState.is(MState.Debug)) {
            return;
        }

        const cameraSpeed = 0.005;

        if (Keyboard.isKeyDown(87 /* W*/)) { Camera.timeTranslate(MM.vec3(0, cameraSpeed, 0), dt); }
        if (Keyboard.isKeyDown(65 /* A*/)) { Camera.timeTranslate(MM.vec3(-cameraSpeed, 0, 0), dt); }
        if (Keyboard.isKeyDown(83 /* S*/)) { Camera.timeTranslate(MM.vec3(0, -cameraSpeed, 0), dt); }
        if (Keyboard.isKeyDown(68 /* D*/)) { Camera.timeTranslate(MM.vec3(cameraSpeed, 0, 0), dt); }
        if (Keyboard.isKeyDown(69 /* E*/)) { Camera.timeTranslate(MM.vec3(0, 0, cameraSpeed), dt); }
        if (Keyboard.isKeyDown(67 /* C*/)) { Camera.timeTranslate(MM.vec3(0, 0, -cameraSpeed), dt); }
    }

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

    function drawGems(dt, tt) {
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

            tBar.position.set(UITrack.POSITION_X, 0, zOffset);
            tBar.rotation.z = (-Math.PI) - zRot;
            Camera.render(meshes.XZQuad, tBar, color);

            tBar.position.set(UITrack.POSITION_X + UITrack.WIDTH, 0, zOffset);
            tBar.rotation.z = zRot;
            Camera.render(meshes.XZQuad, tBar, color);

            const sliceGems = slice.gems || [];
            gems[i].scale.set(0);

            if ((sliceIndex + i) % 2 === 0) {
                for (let l = 0; l < UITrack.NUM_LANES; l++) {
                    if (sliceGems[l] === 0 || sliceGems[l] === 2) {
                        continue;
                    }

                    const gemXPos = UITrack.POSITION_X + UITrack.LANE_WIDTH / 2 + UITrack.LANE_WIDTH * l;
                    gems[i].position.set(gemXPos, 0.1, zOffset);
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

    function init() {
        Camera.init();
        MScheduler.suspend();
        MScheduler.startMainLoop();

        const players = $scope.warpGame.getPlayers();
        let clientShip = null;
        let clientPlayer = null;
        players.forEach((player) => {
            if (player.getUser() === $scope.clientUser) {
                clientPlayer = player;
                clientShip = player.getShip();

                const color = player.getColor();
                $scope.clientColor = Color.rgba(color.x, color.y, color.z, 1);
            }
            return player.getShip();
        });

        warpDrive = $scope.warpGame.getWarpDrive();
        State.current = State.Playing;
        $scope.posX = 0;

        function sendKeysReleased() {
            if (!Keyboard.isKeyDown(Keys.Left) && !Keyboard.isKeyDown(Keys.Right)) {
                clientShip.strafe(0);
            } else {
                clientShip.strafe(Keyboard.isKeyDown(Keys.Left) ? -1 : 1);
            }
        }

        Keyboard.onKeyDown(Keys.Left, () => clientShip.strafe(-1));
        Keyboard.onKeyDown(Keys.Right, () => clientShip.strafe(1));

        Keyboard.onKeyUp(Keys.Left, sendKeysReleased);
        Keyboard.onKeyUp(Keys.Right, sendKeysReleased);

        MScheduler.schedule((dt, tt) => {
            $scope.posX = clientShip.getTransform().position.toString(3);
            $scope.updateTime = clientShip.getUpdateTime();
            $scope.tCamera = Camera.getPos().toString(3);
            $scope.clientScore = clientPlayer.getScore();
            $scope.sliceIndex = `${warpDrive.getSliceIndex()} ${warpDrive.getBarOffset().toFixed(2)}`;

            if (warpDrive.getUpdateTime() > DriveParams.LEVEL_BUFFER_START && Player.state !== Player.states.Playing) {
                $scope.match.getSong().then(Player.playClip);
            }

            processCameraInput(dt);

            MScheduler.draw(() => {
                drawLanes(Camera);
                drawGems(dt, tt);
                Camera.present();
                players.forEach(player => Camera.render(
                    Geometry.meshes.Ship,
                    player.getShip().getTransform(),
                    player.getColor()));
                Camera.present();
            });
        });
    }

    $scope.$on('$destroy', () => {
        State.current = State.Paused;
        MScheduler.suspend();
        MScheduler.reset();
    });

    $scope.$on(GameEvent.playStarted, init);
}

