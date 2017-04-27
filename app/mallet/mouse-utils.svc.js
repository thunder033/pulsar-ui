
/**
 * Created by gjr8050 on 12/5/2016.
 */
const MDT = require('./mallet.dependency-tree').MDT;

require('angular')
    .module('mallet')
    .service(MDT.MouseUtils, [MouseUtils]);

function MouseUtils() {
    // http://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
    function getCoords(elem) { // crossbrowser version
        const box = elem.getBoundingClientRect();

        const body = document.body;
        const docEl = document.documentElement;

        const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        const clientTop = docEl.clientTop || body.clientTop || 0;
        const clientLeft = docEl.clientLeft || body.clientLeft || 0;

        const top  = box.top +  scrollTop - clientTop;
        const left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }

    /**
     * Get the relative coordinates of a mouse click
     * @param {Event} e
     * @param {Element} [target=e.target]
     * @returns {{x: {number}, y: {number}}}
     */
    this.getElementCoords = (e, target) => {
        target = target || e.target;
        const mouse = {}; // make an object
        const coords = getCoords(target);
        mouse.x = e.pageX - coords.left;
        mouse.y = e.pageY - coords.top;
        return mouse;
    };
}
