/**
 * Coordinates state changes triggered from different game components
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const GameEvent = require('event-types').GameEvent;
const DriveParams = require('game-params').DriveParams;
const IOEvent = require('event-types').IOEvent;
const MatchEvent = require('event-types').MatchEvent;

module.exports = {FlowCtrl,
resolve: ADT => [
    ADT.mallet.State,
    ADT.mallet.Keyboard,
    ADT.warp.State,
    ADT.mallet.Scheduler,
    ADT.mallet.const.Keys,
    ADT.audio.Player,
    ADT.network.Connection,
    ADT.network.Client,
    ADT.ng.$scope,
    ADT.shared.Status,
    FlowCtrl]};

function FlowCtrl(MState, Keyboard, State, Scheduler, Keys, AudioPlayer, Connection, Client, $scope, Status) {
    $scope.warpState = State;

    // Emit pause/resume messages to server
    const removeEscListener = Keyboard.onKeyDown(Keys.Escape, () => { // Escape key toggles playing
        if (State.is(State.Playing) || State.is(State.Paused)) {
            if (MState.is(MState.Running)) {
                Client.emit(GameEvent.pause);
            } else {
                Client.emit(GameEvent.resume);
            }
        }
    });

    function pauseGame(e) {
        if (e.player) {
            const dismiss = Status.displayConditional(`${e.player.getUser().getName()} paused the game.`);
            const removeStateListener = MState.onState(MState.Running, () => {
                dismiss();
                removeStateListener();
            });
        }
        Scheduler.suspend();
    }

    function resumeGame(e) {
        if (e.player) {
            Status.display(`${e.player.getUser().getName()} resumed the game.`);
        }
        Scheduler.resume();
        const songTime = (e.time + Connection.getPing() - DriveParams.LEVEL_BUFFER_START) / 1000;
        AudioPlayer.seekToTime(songTime);
    }

    // Forward Game Events to the local scheduler
    Client.addEventListener(GameEvent.pause, pauseGame);
    Client.addEventListener(GameEvent.resume, resumeGame);

    // Don't need to worry about removing excess handlers for these at the moment
    Client.addEventListener(GameEvent.playEnded, () => {
        State.current = State.LevelComplete;
        Scheduler.suspend();
    });

    Connection.addEventListener(IOEvent.disconnect, () => {
        Scheduler.suspend();
    });

    Connection.addEventListener(IOEvent.reconnect, () => {
        Scheduler.resume();
    });

    // Handle actual events when scheduler receives them
    // These get removed by clearing MState
    MState.onState(MState.Suspended, () => {
        if (State.is(State.Playing)) {
            State.current = State.Paused;
            AudioPlayer.pause();
        }
    });

    MState.onState(MState.Running, () => {
        if (State.is(State.Paused)) {
            State.current = State.Playing;
        }
    });

    // Scope methods
    $scope.resume = () => {
        Client.emit(GameEvent.resume);
    };

    $scope.endGame =  function endGame() {
        Client.emit(MatchEvent.requestEnd);
    };

    $scope.$on('$destroy', () => {
        MState.clearState();
        removeEscListener();
        Client.removeEventListener(GameEvent.resume, resumeGame);
        Client.removeEventListener(GameEvent.pause, pauseGame);
    });
}
