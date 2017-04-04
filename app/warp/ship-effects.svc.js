/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    'use strict';
    const MDT = require('../mallet/mallet.dependency-tree').MDT;
    angular.module('pulsar.warp').service('warp.ShipEffects', [
        'warp.Ship',
        MDT.ParticleEmitter,
        MDT.Scheduler,
        MDT.Math,
        MDT.Geometry,
        MDT.Easel,
        'audio.AudioFx',
        MDT.Color,
        ShipEffects]);

    function ShipEffects(Ship, MParticle, MScheduler, MM, Geometry, MEasel, AudioFx, MColor) {

        var collectSound = new AudioFx.Effect({clipId: 'gemCollect', gain: 0.35}),
            blackGemImpact = new AudioFx.Effect({clipId: 'blackGem', gain: 2});

        function blitGemShard(lightness){
            var size = 10;
            //Create a temporary canvas
            MEasel.createNewCanvas('particle', size, size);
            var cacheCtx = MEasel.getContext('particle');
            cacheCtx.fillStyle = MColor.hsla(127, '100%', lightness + '%', 0.8);
            cacheCtx.fillRect(0, 0, size, size);

            //Return the rendered image
            return cacheCtx.canvas;
        }

        function blitBlackGemShard(lightness){
            var size = 15;
            //Create a temporary canvas
            MEasel.createNewCanvas('particle', size, size);
            var cacheCtx = MEasel.getContext('particle');
            cacheCtx.fillStyle = MColor.hsla(0, '0%', lightness + '%', 0.8);
            cacheCtx.beginPath();
            cacheCtx.moveTo(0, size);
            cacheCtx.lineTo(size / 2, 0);
            cacheCtx.lineTo(size, size);
            cacheCtx.closePath();
            cacheCtx.fill();

            //Return the rendered image
            return cacheCtx.canvas;
        }

        var basicShards = [
            blitGemShard(25),
            blitGemShard(50),
            blitGemShard(75)];

        var blackShards = [
            blitBlackGemShard(0),
            blitBlackGemShard(25),
            blitBlackGemShard(50)];

        var tEmitter = new Geometry.Transform().scaleBy(4);
        var collectEmitter = new MParticle.Emitter({
            maxParticleCount: 30,
            transform: tEmitter,
            priority: 9,
            rate: 0,
            image: basicShards,

            energy: 500,
            sizeDecay: 0.08,
            speed: 1.5,
            startVelocity: MM.vec3(0, 0, 0.01),
            spread: MM.vec3(1, 1, 0.5)
        });

        var blackShardEmitter = new MParticle.Emitter({
            maxParticleCount: 30,
            transform: tEmitter,
            priority: 9,
            rate: 0,
            image: blackShards,

            energy: 500,
            sizeDecay: 0.08,
            speed: 1.5,
            startVelocity: MM.vec3(0, 0, 0.01),
            spread: MM.vec3(1, 1, 0.5)
        });

        function blitTrail(){
            var height = 20,
                width = height * 4;
            //Create a temporary canvas
            MEasel.createNewCanvas('trail', width, height);
            var cacheCtx = MEasel.getContext('trail');
            cacheCtx.fillStyle = 'rgba(255, 20, 20, .5)';
            //cacheCtx.fillStyle = 'rgba(255, 255, 255, .5)';
            cacheCtx.beginPath();
            cacheCtx.moveTo(0, height);
            cacheCtx.lineTo(width / 4, 0);
            cacheCtx.lineTo(3 * width / 4, 0);
            cacheCtx.lineTo(width, height);
            cacheCtx.closePath();
            cacheCtx.fill();

            //Return the rendered image
            return cacheCtx.canvas;
        }

        var tTrail = new Geometry.Transform();
        new MParticle.Emitter({
            maxParticleCount: 7,
            transform: tTrail,
            priority: 1001,
            rate: MParticle.Emitter.Uniform,

            energy: 600,
            speed: 0.85,
            startVelocity: MM.vec3(0, 0.0006, 0.01),
            spread: MM.Vector3.Zero,
            image: blitTrail()
        });

        this.emitCollectionBurst = function () {
            collectSound.playInstance();
            for(var i = 0; i < 10; i++){
                collectEmitter.emit();
            }
        };

        this.emitBlackShardBurst = function () {
            blackGemImpact.playInstance();
            for(var i = 0; i < 15; i++){
                blackShardEmitter.emit();
            }
        };

        var tShip = Ship.transform;

        MScheduler.schedule(()=>{
            tEmitter.position.x = tShip.position.x;
            tEmitter.position.y = tShip.position.y + 0.2;
            tEmitter.position.z = tShip.position.z;

            tTrail.position.set(
                tShip.position.x,
                tShip.position.y,
                tShip.position.z + 0.5);

        }, Ship.priority + 1);
    }
})();