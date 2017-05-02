/**
 * @author Greg Rozmarynowycz <greg@thunderlab.net>
 */

const MDT = require('../mallet/mallet.dependency-tree').MDT;
const GameEvent = require('event-types').GameEvent;

module.exports = {FlowCtrl,
resolve: ADT => [
    MDT.State,
    MDT.Keyboard,
    ADT.warp.State,
    MDT.Scheduler,
    MDT.Keys,
    ADT.audio.Player,
    ADT.network.Connection,
    ADT.network.Client,
    ADT.ng.$scope,
    FlowCtrl]};

function FlowCtrl(MState, Keyboard, State, Scheduler, Keys, AudioPlayer, Connection, Client, $scope) {
    $scope.warpState = State;

    // Emit pause/resume messages to server
    Keyboard.onKeyDown(Keys.Escape, () => { // Escape key toggles playing
        if (State.is(State.Playing) || State.is(State.Paused)) {
            if (MState.is(MState.Running)) {
                Client.emit(GameEvent.pause);
            } else {
                Client.emit(GameEvent.resume);
            }
        }
    });

    // Forward Game Events to the local scheduler
    Client.addEventListener(GameEvent.pause, () => {
        Scheduler.suspend();
    });

    Client.addEventListener(GameEvent.resume, (data) => {
        Scheduler.resume();
        const songTime = data.time + Connection.getTimeDifference();
        AudioPlayer.seekTo(songTime);
    });

    // Handle actual events when scheduler receives them
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
}
