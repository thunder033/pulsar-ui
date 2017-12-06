/**
 * Created by gjrwcs on 9/15/2016.
 */

const MDT = require('./mallet.dependency-tree').MDT;
require('angular').module('mallet').service(MDT.Easel, [
    MDT.Log,
    Easel]);

function Easel(Log) {
    const contexts = {};
    const defaultKey = 'default';
    let lowPerformanceMode = false;
    let performanceModeToggles = 0;
    const toggleLimit = 8;

    return {
        get context() {
            return contexts[defaultKey];
        },
        toggleLowPerformanceMode(value) {
            lowPerformanceMode = value;
            // if performance degrades repeatedly, just stay in low performance mode
            if (performanceModeToggles++ > toggleLimit) {
                lowPerformanceMode = true;
            }
            return lowPerformanceMode;
        },
        isLowPerformanceMode() {
            return lowPerformanceMode;
        },
        isLowPerformanceModeForced() {
            return performanceModeToggles > toggleLimit;
        },
        createNewCanvas(contextKey, width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            contexts[contextKey] = canvas.getContext('2d');
            return canvas;
        },
        getContext(contextKey) {
            return contexts[contextKey];
        },
        removeContext(contextKey) {
            delete contexts[contextKey];
        },
        /**
         * Use a symmetric quarter render to fill canvas
         * @param ctx
         * @param image
         * @param origin
         */
        drawQuarterRender(ctx, image, origin) {
            ctx.drawImage(image, origin.x, origin.y);

            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);
            ctx.scale(1, -1);
            ctx.drawImage(image, 0, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(image, 0, 0);
            ctx.restore();
        },
        setActiveContext(newContext) {
            contexts[defaultKey] = newContext;
        },
        clearCanvas(ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        },
        /**
         * Resize the canvas to the given scale, taking into account device pixel ratio
         * @param canvas
         * @param ctx
         * @param [scale=1] {number}
         */
        resizeCanvas(canvas, ctx, scale = 1) {
            Log.debug(`resize ${canvas.id || canvas.className} to ${scale}`);
            // finally query the various pixel ratios
            const devicePixelRatio = window.devicePixelRatio || 1;
            const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1;

            const ratio = devicePixelRatio / backingStoreRatio;

            // const oldWidth = canvas.clientWidth;
            // const oldHeight = canvas.clientHeight;

            canvas.width = canvas.clientWidth * scale;
            canvas.height = canvas.clientHeight * scale;

            if (devicePixelRatio !== backingStoreRatio || scale !== 1) {
                canvas.width *= ratio;
                canvas.height *= ratio;

                // original code suggested "restoring" these values, but this doesn't allow
                // the canvas to resize dynamically, and relying on pure css appears to yield
                // desired behavior
                // canvas.style.width = `${oldWidth}px`;
                // canvas.style.height = `${oldHeight}px`;
                
                // We don't appear to need this working w/ relative sizes
                // ctx.scale(ratio, ratio);

                ctx = canvas.getContext('2d');
            }
        },
    };
}
