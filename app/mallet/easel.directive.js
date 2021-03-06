/**
 * Created by gjrwcs on 9/15/2016.
 */
const MDT = require('./mallet.dependency-tree').MDT;
require('angular').module('mallet').directive('mEasel', [
    MDT.Easel,
    MDT.Scheduler,
    MDT.State,
    easelDirective]);

function easelDirective(MEasel, Scheduler, MState) {
    let canvas;
    let ctx;
    let scale = 1;

    return {
        restrict: 'E',
        scope: {
            context: '&',
        },
        replace: true,
        template: '<div class="easel"><canvas>Your browser does not support canvas</canvas></div>',
        link(scope, elem, attr) {
            canvas = elem[0].querySelector('canvas');
            canvas.style.background = '#000';
            ctx = canvas.getContext(attr.context || '2d');

            MEasel.resizeCanvas(canvas, ctx);
            MEasel.setActiveContext(ctx);

            // Create a context to hold pre-rendered data
            const baseCanvas = MEasel.context.canvas;
            MEasel.createNewCanvas('quarterRender', baseCanvas.width / 2, baseCanvas.height / 2);

            const onResize = () => {
                MEasel.resizeCanvas(canvas, ctx);
                const resizedCanvas =  MEasel.context.canvas;
                MEasel.createNewCanvas('quarterRender', resizedCanvas.width / 2, resizedCanvas.height / 2);
            };

            window.addEventListener('resize', onResize);
            scope.$on('$destroy', () => {
                if (MEasel.context === ctx) {
                    MEasel.removeContext('default');
                }
                window.removeEventListener('resize', onResize);
                elem[0].removeChild(canvas);
            });

            Scheduler.schedule(() => {
                const lowResScale = 0.75;
                // Reduce canvas resolution is performance is bad
                if (Scheduler.FPS < 30 && !MEasel.isLowPerformanceMode()) {
                    MEasel.toggleLowPerformanceMode(true);
                    scale = lowResScale;
                    MEasel.resizeCanvas(canvas, ctx, scale);
                } else if (
                    !MEasel.isLowPerformanceModeForced()
                    && Scheduler.FPS > 40
                    && MEasel.isLowPerformanceMode()) {
                    MEasel.toggleLowPerformanceMode(false);
                    scale = 1;
                    MEasel.resizeCanvas(canvas, ctx, scale);
                }

                Scheduler.draw(() => MEasel.clearCanvas(ctx), -1);
                Scheduler.draw(() => MEasel.clearCanvas(MEasel.getContext('quarterRender')), -1);

                if (MState.is(MState.Debug)) {
                    Scheduler.draw(() => {
                        ctx.fillStyle = '#fff';
                        ctx.fillText(`FPS: ${~~Scheduler.FPS}`, 25, 25);
                    }, 1);
                }
            });
        },
    };
}
