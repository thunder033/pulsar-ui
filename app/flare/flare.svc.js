/**
 * Created by Greg on 9/18/2016.
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
(()=>{
    'use strict';
    require('angular').module('pulsar.flare').service('Flare', [
        MDT.Scheduler,
        MDT.Easel,
        'flare.const.Effects',
        'audio.const.FrequencyRanges',
        MDT.Color,
        'flare.WaveformAnalyzer',
        'flare.FrequencyAnalyzer',
        'flare.FrequencyPinwheel',
        MDT.ParticleEmitter2D,
        Flare]);

    function Flare(MScheduler, MEasel, Effects, FrequencyRanges, MColor, WaveformAnalyzer, FrequencyAnalyzer, FrequencyPinwheel, MParticleEmitter2D) {

        //pulse values - these don't strictly need priority queues, but they work
        var radialPulses = new PriorityQueue(), //pulses generated from waveform - drawn as circles
            linearPulses = []; //pulses generated from frequency - drawn as bulges across center

        var visualizer = {
            init(){
                MScheduler.suspendOnBlur(false);
                MScheduler.schedule(update);

                //Create a context to pre-render pinwheel arcs
                var canvas = MEasel.context.canvas;
                MEasel.createNewCanvas('arcRender', canvas.width / 2, canvas.height / 2);
            },
            effects: [],
            waveform: WaveformAnalyzer.getMetrics(),
            velocity: 0,
            hue: 0,
            noiseThreshold: 0.1,
            angle: 0,
            frequencyMaxes: FrequencyAnalyzer.getMetrics().maxRangeLoudness
        };

        /**
         * Returns a map of the active pixel effects, based on the visualizer effects array
         * @returns {{}}
         */
        function getActiveEffects() {
            var effects = {};
            Object.keys(Effects).forEach(effect=> {
                //using explicit boolean values here greatly improves performance
                effects[effect] = visualizer.effects.indexOf(effect) > -1;
            });
            return effects;
        }

        /**
         * Performs pixel-level manipulation based on the active visualizer effects
         * @param ctx
         */
        function manipulatePixels(ctx) {
            //if there's no effects active, bail out
            if (!visualizer.effects.length) {
                return;
            }

            // i) get all of the rgba pixel data of the canvas by grabbing the imageData Object
            var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

            var data = imgData.data,
                length = data.length,
                noiseThreshold = parseFloat(visualizer.noiseThreshold),
                activeEffects = getActiveEffects(),

                noise = activeEffects[Effects.NOISE],
                invert = activeEffects[Effects.INVERT],
                desaturate = activeEffects[Effects.DESATURATE];

            //iterate over each pixel, applying active effects;
            for (var i = 0; i < length; i += 4) {

                if (noise === true && Math.random() < noiseThreshold) {
                    data[i] = data[i + 1] = data[i + 2] = 255 * Math.random();
                }

                if (invert === true) {
                    data[i] = 255 - data[i];
                    data[i + 1] = 255 - data[i + 1];
                    data[i + 2] = 255 - data[i + 2];
                }

                if (desaturate === true) {
                    //StackOverflow user Shmiddty
                    //http://stackoverflow.com/questions/13348129/using-native-javascript-to-desaturate-a-colour
                    var grey = (data[i] * 0.3086 + data[i + 1] * 0.6094 + data[i + 2] * 0.0820);
                    data[i] = data[i + 1] = data[i + 2] = grey;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        }

        /**
         * Draw radial pulses into the lower-right quarter of the the provided context
         * @param ctx the context to draw on
         * @param origin where to start drawing from
         * @param maxRadius the max radius of the pulses
         */
        function drawQuarterRadialPulses(ctx, origin, maxRadius) {
            //PULSES

            //Derive new velocity value from the period the waveform
            var vel = (1 / visualizer.waveform.period) / 20000;

            //If the new velocity is greater than current, generate a new pulse
            if (vel > visualizer.velocity) {
                var energy = Math.min((visualizer.waveform.amplitude) / 10, 1);
                radialPulses.enqueue(0, {pos: 0, energy: energy});
            }

            //Either keep the new, higher velocity, or decay the existing velocity
            var decayRate = 0.03;
            visualizer.velocity = vel > visualizer.velocity ? vel : visualizer.velocity * (1 - decayRate);

            //Create a gradient that will show the pulses
            var gradient2 = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, maxRadius);

            //Add stops for each pulse
            var it = radialPulses.getIterator(),
                pulseVelocity = 0.008,
                pulse;

            while (!it.isEnd()) {
                pulse = it.next();
                pulse.pos += pulseVelocity;

                var stopPos = Math.min(pulse.pos, 1),
                    stopEnd = Math.min(pulse.pos + 0.05, 1),
                //I'm sure there's a name for this, but this math makes the opacity fall off after reaching a stop value of .5
                    a = stopPos > 0.5 ? (1 - (stopPos - 0.5) * 2) : 1,
                    opacity = a * a * pulse.energy;

                gradient2.addColorStop(stopPos, MColor.rgba(255, 255, 255, opacity));
                gradient2.addColorStop(stopEnd, MColor.rgba(255, 255, 255, 0));
            }

            //Remove pulses that are outside the cirlce
            while (radialPulses.peek() && radialPulses.peek().pos > 1) {
                radialPulses.dequeue();
            }

            //Draw a quarter of of the pulses so we can copy and paste
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, maxRadius, 0, Math.PI / 2);
            ctx.fill();
        }

        /**
         * Draw a single linear pulse with the provided values
         * @param pulse
         * @param ctx
         * @param origin
         * @param width
         * @param height
         */
        function renderLinearPulse(pulse, ctx, origin, width, height) {
            var curveSize = width / 12, //how wide the bezier curve will be
                curveScale = width / 2 - curveSize, //how wide the overall path of the curve will be
                curveStartX = origin.x + curveSize + curveScale * pulse.position - curveSize; //where the curve will be this frame

            ctx.beginPath();
            ctx.moveTo(curveStartX, origin.y);

            //calculate how large the curve should be drawn
            //if the curve has a lower energy value it will start shrinking
            var weight = pulse.energy < 0.1 ? (pulse.energy) * 10 : 1;
            //the curve will grow out from the center instead snapping into existence
            var positionWeight = pulse.position < 0.15 ? pulse.position / 0.15 : 1;

            var cp1x = curveStartX + curveSize / 3;
            var cp2x = curveStartX + 2 * curveSize / 3;
            var cp1y = origin.y;
            var cp2y = origin.y + pulse.magnitude * weight * positionWeight + (Math.random() * height / 100);

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, curveStartX + curveSize, origin.y);
            ctx.closePath();

            //Curves at the lower end of the frequency spectrum will be brighter
            var alpha = 0.5 + 0.5 * ((1 - pulse.frequencyRange) / FrequencyRanges.length);
            ctx.fillStyle = MColor.rgba(255, 255, 255, alpha);
            ctx.fill();
        }

        /**
         * Process and draw the linear pulses into lower right portion of the canvase
         * @param ctx
         * @param origin
         * @param width
         * @param height
         */
        function drawQuarterLinearPulses(ctx, origin, width, height) {
            //Linear Pulses
            var pulseDecayRate = 0.04, //The rate at which the energy pulses decay - how long they persist
                pulseThreshold = 0.0001, //The minimum energy value a pulse must have to be rendered
                pulseVelocity = 0.005 + visualizer.velocity / 1.7, //The speed at which pulses travel from center (0) to edge (1)
                nextPulses = [], //The pulses that will be rendered next frame
                largestPulses = new Array(FrequencyRanges.length); //Array of highest energy pulses for each frequency range

            largestPulses.fill(0);

            //Update and render each pulse
            linearPulses.forEach(function (pulse) {
                //Don't worry about pulses that are too weak to show up
                if (pulse.energy > pulseThreshold) {

                    //Update pulse properties
                    pulse.energy *= (1 - pulseDecayRate);
                    pulse.position += pulse.position > 0.85 ? pulseVelocity * ((1 - pulse.position) / 0.15) : pulseVelocity;

                    renderLinearPulse(pulse, ctx, origin, width, height);

                    //Record the pulse with the highest remaining energy
                    if (pulse.energy * pulse.volume > largestPulses[pulse.frequencyRange]) {
                        largestPulses[pulse.frequencyRange] = pulse.energy * pulse.volume;
                    }

                    //queue the pulse to rendered next round
                    nextPulses.push(pulse);
                }
            });

            //Create new pulses for each frequency range that has a high enough frequency
            for (var i = 0; i < FrequencyRanges.length; i++) {
                if (visualizer.frequencyMaxes[i] > largestPulses[i] * 2) {
                    nextPulses.push({
                        //where the pulse is positioned
                        position: 0,
                        //how much longer the pulse will be displayed
                        energy: 0.5 + (FrequencyRanges.length - i) * (0.5 / FrequencyRanges.length),
                        //how large the pulse appears - derived from frequency, loudness, waveform amplitude
                        magnitude: (FrequencyRanges.length - i) * (visualizer.waveform.amplitude / 20) * (visualizer.frequencyMaxes[i] / 40),
                        //how loud the pulse when it was generated
                        volume: visualizer.frequencyMaxes[i],
                        //frequency range the pulse was generated for
                        frequencyRange: i
                    });
                }
            }

            //Set the collection of pulses for the next frame
            linearPulses = nextPulses;
        }

        function drawRadialPulses(origin, ctx) {
            var quarterCtx = MEasel.getContext('quarterRender');
            drawQuarterRadialPulses(quarterCtx, {x: 0, y: 0}, ctx.canvas.width / 2);
            //mirror the image into the other quadrants
            MEasel.drawQuarterRender(ctx, quarterCtx.canvas, origin);
        }

        function drawLinearPulses(origin, ctx) {
            var quarterCtx = MEasel.getContext('quarterRender');
            MEasel.clearCanvas(quarterCtx);
            drawQuarterLinearPulses(quarterCtx, {x: 0, y: 0}, ctx.canvas.width, ctx.canvas.height);
            //mirror the image into the other quadrants
            MEasel.drawQuarterRender(ctx, quarterCtx.canvas, origin);
        }

        function update() {
            visualizer.angle += visualizer.velocity;

            //Update the particle emitter
            var avgLoudness = FrequencyAnalyzer.getMetrics().avgLoudness;
            //Particles should exist short when things are more active or if frame rate is bad
            MParticleEmitter2D.setInitEnergy((MScheduler.FPS / 12.5) * 0.8 - (avgLoudness / 256));
            MParticleEmitter2D.incrementEmission(avgLoudness / 5);
            MParticleEmitter2D.setParticleSpeed(visualizer.velocity * 1200);

            var canvas = MEasel.context.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2};

            MScheduler.draw(()=> {
                //Draw the background color
                MEasel.context.fillStyle = MColor.hsla(visualizer.hue, '90%', '10%', 1);
                MEasel.context.fillRect(0, 0, canvas.width, canvas.height);
            });

            //Queue up draw commands for visualization
            MScheduler.draw(()=> drawRadialPulses(origin, MEasel.context), 99);
            MScheduler.draw(()=> FrequencyPinwheel.draw(origin, visualizer.hue, MEasel.context, visualizer.angle), 100);
            MScheduler.draw(()=> drawLinearPulses(origin, MEasel.context), 101);

            //Apply pixel manipulation effects
            MScheduler.postProcess(()=>manipulatePixels(MEasel.context));
        }

        return visualizer;
    }
})();

