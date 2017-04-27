/**
 * Created by gjrwcs on 10/27/2016.
 */
const MDT = require('./mallet.dependency-tree').MDT;
const math = require('angular').module('mallet-math', []).service(MDT.Math, [MathService]);

function MathService() {
    class Vector3 {
        /**
         * A simple vector class
         * @param x
         * @param y
         * @param z
         * @constructor
         */
        constructor(x, y, z) {
            this.x = x;
            this.y = typeof y !== 'undefined' ? y : x;
            this.z = typeof z !== 'undefined' ? z : x;
            Object.seal(this);
        }

        /**
         * Creates a shallow copy of the vector
         * @returns {Vector3}
         */
        clone() {
            return new Vector3(this.x, this.y, this.z);
        }

        /**
         * Set the vector components to those provided
         * @param {number|Vector3} x
         * @param {number} [y]
         * @param {number} [z]
         * @returns {Vector3}
         */
        set(x, y, z) {
            if (x instanceof Vector3) {
                this.x = x.x;
                this.y = x.y;
                this.z = x.z;
            }        else {
                this.x = x;
                this.y = typeof y === 'number' ? y : x;
                this.z = typeof z === 'number' ? z : x;
            }
            return this;
        }

        /**
         * Add the given vector to this one
         * @param addend {Vector3}
         */
        add(addend) {
            this.x += addend.x;
            this.y += addend.y;
            this.z += addend.z;
            return this;
        }

        /**
         * Subtract the given vector to this one
         * @param addend {Vector3}
         */
        subtract(addend) {
            this.x -= addend.x;
            this.y -= addend.y;
            this.z -= addend.z;
            return this;
        }

        /**
         * Scale the vector by the scalar
         * @param scalar
         * @returns {*}
         */
        scale(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            this.z *= scalar;
            return this;
        }

        /**
         * Multiplies each component of the 2 vectors
         * @param factor
         * @returns {*}
         */
        mult(factor) {
            this.x *= factor.x;
            this.y *= factor.y;
            this.z *= factor.z;
            return this;
        }

        /**
         * Calculates the cross produce of the vector and b
         * @param b {Vector3}
         * @returns {Vector3}
         */
        cross(b) {
            return new Vector3(
                this.y * b.z - this.z * b.y,
                this.z * b.x - this.x * b.z,
                this.x * b.y - this.y * b.x,
            );
        }

        /**
         * Calcuate the dot product of the vector and b
         * @param b {Vector3}
         * @returns {number}
         */
        dot(b) {
            return this.x * b.x + this.y * b.y + this.z * b.z;
        }

        /**
         * Get the length of the vector
         * @returns {number}
         */
        len() {
            return Math.sqrt(this.len2());
        }

        /**
         * Get the lengths squared of the vector
         * @returns {number}
         */
        len2() {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }

        /**
         * Normalize the vector
         * @returns {Vector3}
         */
        normalize() {
            const len = this.len() || 1;
            return new Vector3(
                this.x / len,
                this.y / len,
                this.z / len);
        }

        /**
         * Create a unit vector from this vector (normalized and positive)
         * @returns {Vector3}
         */
        unit() {
            const len = this.len();
            return new Vector3(
                Math.abs(this.x / len),
                Math.abs(this.y / len),
                Math.abs(this.z / len));
        }

        /**
         * Create a string representation of the vector
         * @returns {string}
         */
        toString(length = 3) {
            return `{${this.x.toFixed(length)}, ${this.y.toFixed(length)}, ${this.z.toFixed(length)}}`;
        }

        toBuffer() {
            return [this.x, this.y, this.z];
        }

        /**
         * Add the 2 vectors
         * @param a {Vector3}
         * @param b {Vector3}
         * @returns {Vector3}
         */
        static add(a, b) {
            return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
        }

        /**
         * Subtract b from a
         * @param a {Vector3}
         * @param b {Vector3}
         * @returns {Vector3}
         */
        static subtract(a, b) {
            return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
        }

        /**
         * Creates a new vector by multiplying a and b
         * @param a {Vector3}
         * @param b {Vector3}
         * @returns {Vector3}
         */
        static mult(a, b) {
            return new Vector3(a.x * b.x, a.y * b.y, a.z * b.z);
        }

        /**
         * Creates a new vector by scaling a by scalar
         * @param a {Vector3}
         * @param scalar {number}
         * @returns {Vector3}
         */
        static scale(a, scalar) {
            return new Vector3(a.x * scalar, a.y * scalar, a.z * scalar);
        }
    }

    Vector3.Zero = Object.freeze(new Vector3(0));
    Vector3.One = Object.freeze(new Vector3(1));

    this.Vector3 = Vector3;

    class Vector2 {
        /**
         * A simple vector class
         * @param x {number}
         * @param y {number}
         * @constructor
         */
        constructor(x, y) {
            this.x = x;
            this.y = typeof y !== 'undefined' ? y : x;
            Object.seal(this);
        }

        /**
         * Set the vector components to those provided
         * @param {number|Vector3} x
         * @param {number} [y]
         * @returns {Vector3}
         */
        set(x, y) {
            if (x instanceof Vector3) {
                this.x = x.x;
                this.y = x.y;
            }        else {
                this.x = x;
                this.y = typeof y === 'number' ? y : x;
            }
            return this;
        }

        /**
         * Adds the given Vector2
         * @param addend {Vector2}
         */
        add(addend) {
            this.x += addend.x;
            this.y += addend.y;
            return this;
        }

        /**
         * Scales the vector by the scalar
         * @param scalar
         * @returns {*}
         */
        scale(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        }

        /**
         * Multiplies each component of the 2 vectors
         * @param factor
         * @returns {*}
         */
        mult(factor) {
            this.x *= factor.x;
            this.y *= factor.y;
            return this;
        }

        toString(length = 3) {
            return `{${this.x.toFixed(length)}, ${this.y.toFixed(length)}}`;
        }

        /**
         *
         * @param a {Vector2}
         * @param b {Vector2}
         * @returns {Vector2}
         */
        static add(a, b) {
            return new Vector2(a.x + b.x, a.y + b.y);
        }
    }

    this.Vector2 = Vector2;

    this.vec2 = (x, y) => new Vector2(x, y);

    this.vec3 = (x, y, z) => new Vector3(x, y, z);

    /**
     * Clamps the value between the min and max
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number} the clamped value
     */
    this.clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    /**
     * Returns the sign (1, 0, or -1) of the value
     * @param {number} value
     * @returns {*|number}
     */
    this.sign = value => value && value / Math.abs(value);

    /**
     * Finds the mean of the values and returns the result
     * @param {number[]} values
     */
    this.average = values => values.reduce((avg, value) => avg + value / values.length, 0);
}

module.exports = math;
