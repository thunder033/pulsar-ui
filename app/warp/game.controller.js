/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    'use strict';
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    require('angular').module('pulsar.warp').controller('warp.GameController', [
        MDT.State,
        'warp.State',
        MDT.Scheduler,
        MDT.Keyboard,
        MDT.const.Keys,
        'audio.Player',
        'media.Library',
        'warp.WarpFieldDraw',
        GameController]);

    function GameController(MState, State, MScheduler, MKeyboard, MKeys, AudioPlayer, MediaLibrary, WarpFieldDraw){
        WarpFieldDraw.init();
        MScheduler.suspendOnBlur(); //Suspend the event loop when the window is blurred

        MediaLibrary.isReady()
            .then(() => State.current = State.LevelComplete);

        //Setup state events
        MState.onState(MState.Suspended, () => {
            if(State.is(State.Playing)){
                State.current = State.Paused;
                AudioPlayer.pause();
            }
        });

        MState.onState(MState.Running, () => {
            if(State.is(State.Paused)){
                State.current = State.Playing;
                AudioPlayer.resume();
            }
        });

        MKeyboard.onKeyDown(MKeys.Escape, () => { //Escape key toggles playing
            if(State.is(State.Playing) || State.is(State.Paused)) {
                if (MState.is(MState.Running)) {
                    MScheduler.suspend();
                } else {
                    MScheduler.resume();
                }
            }
        });
    }
})();