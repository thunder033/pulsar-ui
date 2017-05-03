/**
 * Created by Greg on 9/20/2016.
 */
// StackOverflow user Nidhish Krishnan
// http://stackoverflow.com/questions/30207272/capitalize-the-first-letter-of-string-in-angularjs
require('angular').module('shared').filter('capitalize', () => input =>
        ((input && typeof input === 'string') ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : ''));
