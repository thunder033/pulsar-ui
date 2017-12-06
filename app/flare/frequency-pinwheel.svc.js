/**
* Created by gjr8050 on 10/19/2016.
*/

const MDT = require('../mallet/mallet.dependency-tree').MDT;

/**
 * Provides functions to render the frequency pinwheel
 */
require('angular').module('pulsar.flare').service('flare.FrequencyPinwheel', [
    'audio.RealtimeData',
    MDT.Easel,
    'flare.FrequencyAnalyzer',
    MDT.Color,
    FrequencyPinwheel]);

function FrequencyPinwheel(AudioData, MEasel, FrequencyAnalyzer, MColor) {
    function preRenderArc(color, arcLength, radius) {
        const cacheCtx = MEasel.getContext('arcRender');
        // Pre-render a single arc so it can be transformed fro each section of the pinwheel
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
     * @param filterInterval reduce frequencies drawn to improve performance
     */
    function drawArcSet(ctx, data, start, end, fill, interval, angle, filterInterval) {
        filterInterval = filterInterval || 1; // filter data for performance optimization
        interval = interval || 1;

        // The length of each arc
        const arcLength = ((4 * Math.PI) / FrequencyAnalyzer.getMetrics().dataLimit) * filterInterval;
        const avgLoudness = FrequencyAnalyzer.getMetrics().avgLoudness;
        const maxLoudness = 256;
        const canvas = ctx.canvas;
        const origin = {x: canvas.width / 2, y: canvas.height / 2};
        const arcBuffer = preRenderArc(fill, arcLength, canvas.width / 2);

        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(angle + start * arcLength);

        const rotationDelta = arcLength * interval;
        const startAdjust = (start % filterInterval); // this might only work with an orig interval of 2 or less
        const dataInterval = interval * filterInterval;
        // loop through the data and draw!
        for (let i = start + startAdjust; i < end; i += dataInterval) {
            const loudness = data[i];

            ctx.rotate(rotationDelta);
            if (loudness > 0) {
                // Fudge the radius of the arcs based on the overall average of
                // the previous range to the whole set of arcs is fuller
                const scale = ((loudness + avgLoudness) / (maxLoudness * 2));
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
        const metrics = FrequencyAnalyzer.getMetrics();

        if (metrics.avgLoudness > 120) {
            const arcLength = (4 * Math.PI) / metrics.dataLimit;
            const arcBuffer = preRenderArc('#fff', arcLength, ctx.canvas.width);

            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.rotate(angle);
            ctx.scale(2, 2);

            for (let i = 0; i < peakIndices.length; i++) {
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
        const metrics = FrequencyAnalyzer.getMetrics();
        const data = AudioData.getFrequencies();

        // Draw each set of arcs
        const darkBack = MColor.hsla(hue, 84, 25, 0.65);
        const lightBack = MColor.hsla(hue, 90, 43, 0.75);
        const darkFront = MColor.hsla(hue, 70, 70, 0.5);
        const lightFront = MColor.hsla(hue, 55, 78, 0.5);

        const interval = 2;
        const filterInterval = MEasel.isLowPerformanceMode() && metrics.dataLimit > 256 ? 2 : 1;
        // skip every other
        drawArcSet(ctx, data, 0, metrics.dataLimit / 2, lightBack, interval, angle, filterInterval);
        // offset by 1 and skip ever other arc
        drawArcSet(ctx, data, 1, metrics.dataLimit / 2 + 1, darkBack, interval, angle, filterInterval);
        // start at middle, skip every other
        drawArcSet(ctx, data, metrics.dataLimit / 2, metrics.dataLimit, darkFront, interval, -angle, filterInterval);
        // start middle, offset by 1, skip every other
        drawArcSet(ctx, data,
            metrics.dataLimit / 2 + 1,
            metrics.dataLimit - 1,
            lightFront,
            interval,
            -angle,
            filterInterval);

        drawPeakShimmers(ctx, origin, metrics.maxRangeIndices, angle);

        // Draw circle in center of arcs
        const gradient = ctx.createRadialGradient(origin.x,
            origin.y, metrics.avgLoudness / 10, origin.x, origin.y, metrics.avgLoudness);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.arc(origin.x, origin.y, metrics.avgLoudness, 0, 2 * Math.PI);
        ctx.fill();
    }

    return {
        draw: drawFrequencyPinwheel,
    };
}

