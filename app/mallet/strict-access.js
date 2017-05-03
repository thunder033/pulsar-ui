/**
 * Created by gjrwcs on 5/2/2017.
 */

/**
 * Throw an error if an undefined property is accessed
 * @param obj {Object}
 * @param name {string}
 * @returns {*}
 */
function strictAccess(obj, name) {
    const checkKey = '__strictlyAccessible';
    function canApply(val) {
        return typeof val === 'object' && val !== null && val[checkKey] !== true;
    }

    const undefError = {
        get(target, key) {
            if (key === checkKey) {
                return true;
            } else if (!(key in target)) {
                throw new ReferenceError(`${key} does not exist on ${name}`);
            } else {
                return target[key];
            }
        },
        set(target, key, value) {
            if (canApply(value)) {
                target[key] = strictAccess(value, `${name}.${key}`);
            }
        },
    };

    // Recursively apply strict access to properties of the object
    Object.keys(obj).forEach((key) => {
        if (canApply(obj[key])) {
            obj[key] = strictAccess(obj[key], key);
        }
    });

    return new Proxy(obj, undefError);
}

module.exports = {strictAccess};
