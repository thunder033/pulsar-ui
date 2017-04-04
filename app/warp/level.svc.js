/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    'use strict';
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    angular.module('pulsar.warp').service('warp.Level', [
        MDT.Scheduler,
        'warp.State',
        'flare.WaveformAnalyzer',
        'warp.Bar',
        MDT.Math,
        Level]);

    /**
     * Advances play through the current WarpField
     * @param MScheduler
     * @param State
     * @param WaveformAnalyzer
     * @param Bar
     * @param MM
     * @constructor
     */
    function Level(MScheduler, State, WaveformAnalyzer, Bar, MM){
        var self = this;
        this.barQueue = [0];
        this.barsVisible = 55;
        self.timeStep = NaN; //this s NaN so that if it doesn't get set we don't get an endless while loop

        this.warpField = null;
        this.sliceIndex = 0; //where we are in the level

        var elapsed = 0; //elapsed time since last bar was rendered
        this.barOffset = 0;  //this value allows the bar to "flow" instead of "jump"

        this.frequencies = []; //the set of waveform frequencies to average to determine bar width/speed
        var frequencySamples = 10; //how many waveform frequencies to average

        this.reset = function(){
            //reset level variables
            self.barQueue = [0, 0, 0];
            elapsed = 0;
            self.sliceIndex = 0;
            self.frequencies = [];
            self.timeStep = NaN;
            self.barOffset = 0;
        };

        this.load = warpField => {
            self.timeStep = warpField.timeStep;
            self.warpField = warpField.level;
        };

        this.getLoudness = relativeIndex => {
            return (self.warpField[self.sliceIndex + relativeIndex] || {}).loudness || 0;
        };

        this.update = (dt) => {
            if(State.current !== State.Playing) {
                return;
            }

            //advance through the level
            elapsed += dt;
            /**
             * This creates a sort of independent fixed update the ensures the level follows the song
             * Each bar the screen represents a fixed amount of time, and no matter how wide, can only
             * remain on screen for the duration for everything to stay in sync
             */
            while(elapsed > self.timeStep / 1000){
                elapsed -= (self.timeStep || NaN); //break if timeStep is not set
                self.sliceIndex++;
                self.barOffset = 0; //reset the bar offset

                //remove the bar that just moved off screen
                self.barQueue.shift();

                var waveform = WaveformAnalyzer.getMetrics();
                //Create a new bar
                while(self.barQueue.length < self.barsVisible){
                    //get the current waveform frequency and remove the oldest value
                    self.frequencies.push(((1 / waveform.period) / 10));
                    if(self.frequencies.length > frequencySamples){
                        self.frequencies.shift();
                    }

                    //add a new bar to the queue
                    self.barQueue.push({
                        speed: 0.95 + 0.05 * MM.average(self.frequencies) //this value is basically fudged to work well
                    });
                }
            }

            //how fast the set of bars is moving across the screen
            var velocity = (Bar.scale.z * self.barQueue[2].speed + Bar.margin) / self.timeStep;
            self.barOffset -= dt * velocity;

            if(self.sliceIndex > self.warpField.length){
                State.current = State.LevelComplete;
            }
        };

        /**
         * Update the various properties of the game level
         */
        MScheduler.schedule((dt) => this.update(dt));
    }
})();