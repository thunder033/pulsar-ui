/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const GameEvent = require('event-types').GameEvent;
const Track = require('game-params').Track;

module.exports = {FluxCtrl,
resolve: ADT => [
    ADT.ng.$scope,
    MDT.Scheduler,
    MDT.Camera,
    MDT.Geometry,
    MDT.Math,
    MDT.Keyboard,
    MDT.const.Keys,
    ADT.warp.Level,
    ADT.warp.Bar,
    ADT.warp.State,
    FluxCtrl]};

/**
 *
 * @param $scope
 * @param MScheduler
 * @param Camera {Camera}
 * @param Geometry
 * @param MM
 * @param Keyboard
 * @param Keys
 * @param Level {Level}
 * @param Bar
 * @param State
 * @constructor
 */
function FluxCtrl($scope, MScheduler, Camera, Geometry, MM, Keyboard, Keys, Level, Bar, State) {
    const meshes = Geometry.meshes;
    const mLanePadding = 0.01; //padding on edge of each lane

    const tLane = new Geometry.Transform()
        .scaleBy(Track.LANE_WIDTH - mLanePadding, 1, 60)
        .translate(0, -0.1, 2.3);
    tLane.origin.z = 1;
    const grey = MM.vec3(225,225,225);
    let warpDrive = null;

    const tBar = new Geometry.Transform();
    tBar.origin.set(-1, 0, 1);
    const zRot = - Math.PI / 8;

    function drawLanes(camera) {
        tLane.position.x = Track.POSITION_X + Track.LANE_WIDTH / 2;
        for(let i = 0; i < Track.NUM_LANES; i++) {
            camera.render(meshes.XZQuad, tLane, grey);
            tLane.position.x += Track.LANE_WIDTH;
        }
        camera.present(); //Draw the background
    }

    function processCameraInput(dt) {
        const cameraSpeed = 0.005;

        if (Keyboard.isKeyDown(87 /*W*/)) { Camera.timeTranslate(MM.vec3(0, cameraSpeed, 0), dt); }
        if (Keyboard.isKeyDown(65 /*A*/)) { Camera.timeTranslate(MM.vec3(-cameraSpeed, 0, 0), dt); }
        if (Keyboard.isKeyDown(83 /*S*/)) { Camera.timeTranslate(MM.vec3(0, -cameraSpeed, 0), dt); }
        if (Keyboard.isKeyDown(68 /*D*/)) { Camera.timeTranslate(MM.vec3(cameraSpeed, 0, 0), dt); }
        if (Keyboard.isKeyDown(69 /*E*/)) { Camera.timeTranslate(MM.vec3(0, 0, cameraSpeed), dt); }
        if (Keyboard.isKeyDown(67 /*C*/)) { Camera.timeTranslate(MM.vec3(0, 0, -cameraSpeed), dt); }
    }

    function getStartOffset(barBuffer){
        let startOffset = 6;
        const sliceOffset = 3;
        for(let i = 0; i < sliceOffset; i++){
            startOffset += barBuffer[i].speed * Bar.scale.z + Bar.margin;
        }

        return startOffset;
    }

    function getItems(indices, items){
        return indices.map(i => items[i]);
    }

    const gems = new Array(Level.barsVisible);
    for(let g = 0; g < gems.length; g++){
        gems[g] = new Geometry.Transform();
        //gems[g].position.y = -.5;
        gems[g].rotation.y = Math.PI / 4;
        gems[g].rotation.x = Math.PI / 4;
        gems[g].scale = MM.vec3(0.175);
    }

    function drawGems(dt, tt) {

        //make the first bar yellow
        //ctx.fillStyle = '#ff0';
        let color = MM.vec3(100,255,255);

        const barOffset = warpDrive.getBarOffset();
        const sliceIndex = warpDrive.getSliceIndex();

        let drawOffset = 2 * 0.95 * 0.9; // getStartOffset(Level.barQueue); //this spaces the bars correctly across the screen, based on how far above the plane the camera is

        const blackGems = [];
        for(let i = 0; i < Level.barsVisible; i++){
            if(i + 10 > Level.barsVisible){
                const sliceValue = 1 - (Level.barsVisible - i) / 10;
                color = MM.vec3(100 + sliceValue * 110, 255 - sliceValue * 45, 255 - sliceValue * 45);
            }

            const depth = Bar.scale.z * 0.95; // Level.barQueue[i].speed;
            const zOffset = drawOffset - barOffset;

            tBar.scale.x = Bar.scale.x * 2;
            tBar.scale.z = depth;

            tBar.position.set(Track.POSITION_X, 0, zOffset);
            tBar.rotation.z = (-Math.PI) - zRot;
            Camera.render(meshes.XZQuad, tBar, color);

            tBar.position.set(Track.POSITION_X + Track.WIDTH, 0, zOffset);
            tBar.rotation.z = zRot;
            Camera.render(meshes.XZQuad, tBar, color);

            const sliceGems = (Level.warpField[sliceIndex + i] || {}).gems || [];
            gems[i].scale.set(0);

            if((sliceIndex + i) % 2 === 0){
                for(let l = 0; l < Track.NUM_LANES; l++){
                    if(sliceGems[l] === 0 || sliceGems[l] === 2){
                        continue;
                    }

                    const gemXPos = Track.POSITION_X + Track.LANE_WIDTH / 2 + Track.LANE_WIDTH * l;
                    gems[i].position.set(gemXPos, 0.1, zOffset);
                    if(sliceGems[l] === 1){
                        gems[i].scale.set(0.15);
                        gems[i].rotation.set(0, tt / 1000, 0);
                    } else if(sliceGems[l] === 3){
                        blackGems.push(i);
                        gems[i].rotation.set(
                            tt / 666,
                            tt / 666,
                            Math.PI / 4);
                    }
                }
            }

            drawOffset -= depth + Bar.margin; //add the width the current bar (each bar has a different width)
        }


        const green = MM.vec3(0,225,40);
        Camera.render(meshes.Cube, gems, green);

        const darkGrey = MM.vec3(25);
        const transforms = getItems(blackGems, gems);
        transforms.forEach(t => t.scale.set(0.3));
        Camera.render(meshes.Spike, transforms, darkGrey);

        Camera.present(); //Draw the gems
    }

    function init() {
        // const tCube = new Geometry.Transform()
        //     .scaleBy(0.5)
        //     .translate(0, 0, -5);
        //
        // const tCube2 = new Geometry.Transform()
        //     .scaleBy(0.5)
        //     .translate(0, 0, -15);
        //
        // const tCube3 = new Geometry.Transform()
        //     .scaleBy(0.5)
        //     .translate(0, -5, -5);
        //
        // const tCube4 = new Geometry.Transform()
        //     .scaleBy(0.5)
        //     .translate(0, 5, -15);
        //
        // const tCube5 = new Geometry.Transform()
        //     .scaleBy(0.5, 0.5, 11)
        //     .translate(0, 0.5, -10);
        //
        // const tLane = new Geometry.Transform()
        //     .scaleBy(1.15, 1, 50)
        //     .translate(0, 0, -5);
        //
        // const tCube6 = new Geometry.Transform()
        //     .scaleBy(0.5)
        //     .translate(0, 0.5, -50);
        //
        // tLane.origin.z  = 1;

        const players = $scope.warpGame.getPlayers();
        let clientShip = null;
        console.log($scope.clientUser);
        const ships = players.map((player) => {
            console.log('check user', player.getUser());
            if (player.getUser() === $scope.clientUser) {
                clientShip = player.getShip();
            }
            return player.getShip();
        });

        Level.reset();
        Level.load($scope.warpGame.getWarpField());

        warpDrive = $scope.warpGame.getWarpDrive();
        console.log(State);
        State.current = State.Playing;

        console.log(ships);
        console.log(clientShip);
        $scope.posX = 0;

        function sendKeysReleased() {
            if(!Keyboard.isKeyDown(Keys.Left) && !Keyboard.isKeyDown(Keys.Right)) {
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
            $scope.posX = clientShip.getTransform().position.toString();
            $scope.updateTime = clientShip.getUpdateTime();
            $scope.tCamera = Camera.getPos().toString();
            $scope.sliceIndex = warpDrive.getSliceIndex() + ' ' + warpDrive.getBarOffset().toFixed(2);

            processCameraInput(dt);

            MScheduler.draw(() => {
                drawLanes(Camera);

                players.forEach(player => Camera.render(
                    Geometry.meshes.Ship,
                    player.getShip().getTransform(),
                    player.getColor()));

                // Camera.render(Geometry.meshes.Cube, [tCube], MM.vec3(255, 0, 0));
                // Camera.render(Geometry.meshes.Cube, [tCube2], MM.vec3(0, 255, 0));
                // Camera.render(Geometry.meshes.Cube, [tCube3], MM.vec3(255, 255, 0));
                // Camera.render(Geometry.meshes.Cube, [tCube4], MM.vec3(0, 255, 255));
                // Camera.render(Geometry.meshes.Cube, [tCube5], MM.vec3(255, 0, 255));
                // Camera.render(Geometry.meshes.XZQuad, [tLane], MM.vec3(255, 125, 0));
                // Camera.render(Geometry.meshes.Cube, [tCube6], MM.vec3(255, 255, 255));
                Camera.present();
                drawGems(dt, tt);
            });
        });
    }

    $scope.$on('$destroy', () => {
        State.current = State.Paused;
        MScheduler.reset();
    });

    $scope.$on(GameEvent.playStarted, init);
}
