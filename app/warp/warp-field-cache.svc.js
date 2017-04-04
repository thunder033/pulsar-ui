/**
 * Created by Greg on 11/27/2016.
 */
(()=>{
    'use strict';

    angular.module('pulsar.warp').service('warp.WarpFieldCache', [
        'warp.WarpField',
        WarpFieldCache]);

    function WarpFieldCache(WarpField){

        function getObjectSignature(obj){
            return Object.keys(obj).join();
        }

        this.store = (clip, field) => {
            localStorage.setItem(clip.name, JSON.stringify(field));
        };

        this.retrieve = (clip) => {
            var warpField, signature;

            try {
                warpField = JSON.parse(localStorage.getItem(clip.name));
                signature = getObjectSignature(warpField || {});
            }
            catch(e){
                return null;
            }

            if(signature !== getObjectSignature(new WarpField())){
                localStorage.setItem(clip.name, 'null');
                return null;
            }

            return warpField;
        };
    }
})();