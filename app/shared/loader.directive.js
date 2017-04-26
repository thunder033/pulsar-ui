/**
 * Created by Greg on 9/20/2016.
 */
require('angular').module('shared').directive('loaderIcon', () => ({
    restrict: 'E',
    replace: true,
    template: '<div class="cssload-container"><div class="cssload-speeding-wheel"></div> </div>',
}));
