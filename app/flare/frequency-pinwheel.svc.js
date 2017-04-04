/**
 * Created by gjr8050 on 10/19/2016.
 */
'use strict';
const MDT = require('../mallet/mallet.dependency-tree').MDT;
(()=>{
    /**
     * Provides functions to render the frequency pinwheel
     */
    require('angular').module('pulsar.flare').service('flare.FrequencyPinwheel', [
        'audio.RealtimeData',
        MDT.Easel,
        'flare.FrequencyAnalyzer',
        MDT.Color,
        FrequencyPinwheel]);

    function FrequencyPinwheel(AudioData, MEasel, FrequencyAnalyzer, MColor){

        function preRenderArc(color, arcLength, radius){
            var cacheCtx = MEasel.getContext('arcRender');
            //Pre-render a single arc so it can be transformed fro each section of the pinwheel
            cacheCtx.clearRect(0, 0, cacheCtx.canvas.width, cacheCtx.canvas.height);
            cacheCtx.canvas.height = Math.sin(arcLength) * radius;
            cacheCtx.fillStyle = color;
            cacheCtx.beginPath();
            cacheCtx.moveTo(0, 0);
            cacheCtx.arc(0, 0, radius, 0, arcLength);
            cacheCtx.closePath();
            cacheCtx.fill();

            return cacheCtx.canvas;
        }

        /**
         * Draw a subset of the arcs for the frequency pinwheel
         * @param ctx
         * @param data frequency data to draw with
         * @param start the index to start drawing from
         * @param end the index to stop drawing at
         * @param fill the color to fill the arcs
         * @param interval how many data values to increment each iteration
         * @param angle what rotation to draw the pinwheel at
         */
        function drawArcSet(ctx, data, start, end, fill, interval, angle) {
            interval = interval || 1;

            //The length of each arc
            var arcLength = (4 * Math.PI) / FrequencyAnalyzer.getMetrics().dataLimit,
                avgLoudness = FrequencyAnalyzer.getMetrics().avgLoudness,
                maxLoudness = 256,
                canvas = ctx.canvas,
                origin = {x: canvas.width / 2, y: canvas.height / 2},
                arcBuffer = preRenderArc(fill, arcLength, canvas.width / 2);

            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(angle + start * arcLength);
            // loop through the data and draw!
            for (var i = start; i < end; i += interval) {
                var loudness = data[i];

                ctx.rotate(arcLength * interval);
                if (loudness > 0) {
                    // //Fudge the radius of the arcs based on the overall average of the previous range to the whole set of arcs is fuller
                    var scale = ((loudness + avgLoudness) / (maxLoudness * 2));
                    ctx.save();
                    ctx.scale(scale, scale);
                    ctx.drawImage(arcBuffer, 0, 0);
                    ctx.restore();
                }
            }

            ctx.restore();
        }

        /**
         * Draw shimmers at the loudest frequencies if the average loudness is great enough
         * @param ctx
         * @param origin
         * @param peakIndices
         * @param angle
         */
        function drawPeakShimmers(ctx, origin, peakIndices, angle) {
            var metrics = FrequencyAnalyzer.getMetrics();

            if(metrics.avgLoudness > 120){
                var arcLength = (4 * Math.PI) / metrics.dataLimit,
                    arcBuffer = preRenderArc('#fff', arcLength, ctx.canvas.width);

                ctx.save();
                ctx.translate(origin.x, origin.y);
                ctx.rotate(angle);
                ctx.scale(2 ,2);

                for (var i = 0; i < peakIndices.length; i++) {
                    ctx.save();
                    ctx.rotate(peakIndices[i] * arcLength);
                    ctx.globalAlpha = Math.random();
                    ctx.drawImage(arcBuffer, 0, 0);
                    ctx.restore();
                }

                ctx.restore();
            }
        }

        function drawFrequencyPinwheel(origin, hue, ctx, angle) {
            var metrics = FrequencyAnalyzer.getMetrics(),
                data = AudioData.getFrequencies();

            //Draw each set of arcs
            var darkBack = MColor.hsla(hue, '84%', '25%', 0.65),
                lightBack = MColor.hsla(hue, '90%', '43%', 0.75),
                darkFront = MColor.hsla(hue, '70%', '70%', 0.5),
                lightFront = MColor.hsla(hue, '55%', '78%', 0.5);

            drawArcSet(ctx, data, 0, metrics.dataLimit / 2, lightBack, 2, angle); //skip every other
            drawArcSet(ctx, data, 1, metrics.dataLimit / 2 + 1, darkBack, 2, angle); //offset by 1 and skip ever other arc
            drawArcSet(ctx, data, metrics.dataLimit / 2, metrics.dataLimit, darkFront, 2, -angle); //start at middle, skip every other
            drawArcSet(ctx, data, metrics.dataLimit / 2 + 1, metrics.dataLimit - 1, lightFront, 2, -angle); //start middle, offset by 1, skip every other

            drawPeakShimmers(ctx, origin, metrics.maxRangeIndices, angle);

            //Draw circle in center of arcs
            var gradient = ctx.createRadialGradient(origin.x, origin.y, metrics.avgLoudness / 10, origin.x, origin.y, metrics.avgLoudness);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.arc(origin.x, origin.y, metrics.avgLoudness, 0, 2 * Math.PI);
            ctx.fill();
        }

        return {
            draw: drawFrequencyPinwheel
        };
    }
})();
