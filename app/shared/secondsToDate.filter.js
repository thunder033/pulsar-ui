/**
 * Created by Greg on 10/19/2016.
 */
require('angular').module('shared').filter('secondsToDate', [
    () => seconds => new Date(1970, 0, 0).setSeconds(seconds),
]);
