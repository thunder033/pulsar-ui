/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    'use strict';
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    angular.module('pulsar.warp').service('warp.LevelLoader', [
        'warp.Level',
        'warp.State',
        MDT.State,
        'media.const.State',
        'audio.Player',
        'warp.WarpFieldCache',
        '$q',
        'warp.WarpField',
        LevelLoader]);

    function LevelLoader(Level, State, MState, MediaStates, AudioPlayer, FieldCache, $q, WarpField) {

        function getWarpField(clip) {
            const cachedField = FieldCache.retrieve(clip);
            if(cachedField){
                return $q.when(cachedField);
            }
            else {
                return WarpField.generate(clip).then(warpField => {
                    FieldCache.store(clip, warpField);
                    return warpField;
                });
            }

        }

        this.playClip = function(clip){

            if(clip.getState() !== MediaStates.Buffered){
                return;
            }

            State.current = State.Loading;
            Level.reset();

            //Stop any song that's playing
            AudioPlayer.stop();

            getWarpField(clip).then(function(warpField){
                Level.load(warpField);

                //Play the clip - this can take time to initialize
                return AudioPlayer.playClip(clip).then(()=>{
                    State.current = State.Playing;

                    //Don't start playing the song if game is paused
                    if(MState.is(MState.Suspended)){
                        State.current = State.Paused;
                        AudioPlayer.pause();
                    }
                });
            });
        };
    }
})();