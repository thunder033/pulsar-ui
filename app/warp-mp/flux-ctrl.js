/**
 * TODO: [Description]
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */
const GameEvent = require('event-types').GameEvent;
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
    ADT.warp.State,
    ADT.mallet.Color,
    ADT.audio.Player,
    ADT.mallet.State,
    ADT.game.Render,
    WarpCtrl]};

/**
 * @param $scope
 * @param MScheduler
 * @param Camera {Camera}
 * @param Geometry
 * @param MM
 * @param Keyboard
 * @param Keys
 * @param State
 * @param Color
 * @param Player
 * @param MState
 * @param Render
 * @constructor
 */
function WarpCtrl($scope, MScheduler, Camera, Geometry, MM, Keyboard, Keys, State, Color, Player, MState, Render) {
    $scope.player = Player;
    let warpDrive = null;

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

    function init() {
        Camera.init();
        // Ensure the scheduler is running
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
        Render.setWarpDrive(warpDrive);
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
                Render.drawLanes(Camera);
                Render.drawGems(dt, tt);
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

