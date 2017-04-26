/**
 * Created by gjr8050 on 11/18/2016.
 */
require('angular').module('pulsar').filter('addOption', [addOption]);

function addOption() {
    return (options, option) => {
        options = options || [];
        options.push(option);
        return options;
    };
}
