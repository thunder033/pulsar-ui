/**
 * Created by Greg on 10/5/2016.
 *
 * The particle emitter provider maintains position, velocity, and other properties of each particle drawn
 * on the screen. It provides an interface to change how particles are emitted and when.
 */
const MDT = require('./mallet.dependency-tree').MDT;

require('angular').module('mallet').service(MDT.ParticleEmitter2D, [
    MDT.Scheduler,
    MDT.Easel,
    MDT.const.ScaleFactor,
    MDT.Math,
    ParticleEmitter2D]);

function ParticleEmitter2D(Scheduler, Easel, ScaleFactor, MM) {
    class Particle {
        /**
         * Maintains the properties of a single particle
         * @param position
         * @param velocity
         * @param energy
         * @param size
         * @param image
         * @constructor
         */
        constructor(position, velocity, energy, size, image) {
            this.position = position;
            this.velocity = velocity;
            this.energy = energy * 1000;
            this.size = size;
            this.active = true;
            this.image = image;
        }

        /**
         * Advance simulation of the particle
         * @param dt
         * @param velocityScale
         */
        update(dt, velocityScale) {
            if (!this.active) {
                return;
            }

            this.position.x += this.velocity.x * dt * 0.25 + this.velocity.x * velocityScale * 0.75;
            this.position.y += this.velocity.y * dt * 0.25 + this.velocity.y * velocityScale * 0.75;

            this.energy -= dt;
        }
    }

    /**
     * Pre render a prototype particle into a temporary canvas and retrieve the image
     * @returns {*|HTMLCanvasElement}
     */
    function preRenderParticle() {
        const radius = 10;
        // Create a temporary canvas
        Easel.createNewCanvas('particle', radius * 2, radius * 2);
        const cacheCtx = Easel.getContext('particle');
        const origin   = MM.vec3(cacheCtx.canvas.width / 2);

        // Create a gradient for the particle
        const gradient = cacheCtx.createRadialGradient(origin.x, origin.y, radius / 4, origin.x, origin.y, radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        // Render the particle
        cacheCtx.fillStyle = gradient;
        cacheCtx.beginPath();
        cacheCtx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
        cacheCtx.closePath();
        cacheCtx.fill();

        // Return the rendered image
        return cacheCtx.canvas;
    }

    // Define emission properties
    let particles      = [];
    let speed          = 1 * ScaleFactor;
    let emissionEnergy = 0;
    let initEnergy     = 4;
    let size           = ScaleFactor;
    const particleImage  = preRenderParticle();
    const emitter        = {
        /**
         * Increase the emission energy of the emitter, this energy is depleted each time a particle is emitted
         * @param rate
         */
        incrementEmission(rate) {
            emissionEnergy += rate;
        },
        /**
         * Set a scalar that will adjust the speed of all particles
         * @param newSpeed
         */
        setParticleSpeed(newSpeed) {
            speed = newSpeed * ScaleFactor;
        },
        /**
         * Set the initial lifespan that particles will be emitted with
         * @param energy
         */
        setInitEnergy(energy) {
            initEnergy = energy;
        },
        /**
         * Set the a factor that will adjust the size of new particles
         * @param newSize
         */
        setParticleSize(newSize) {
            size = newSize;
        },
        /**
         * Create a new particle
         */
        emit() {
            const canvas      = Easel.context.canvas;
            const aspectRatio = canvas.width / canvas.height;
            const origin    = MM.vec3(canvas.width / 2, canvas.height / 2);
            particles.push(new Particle(
                MM.vec3(origin.x, origin.y),
                // Make particles evenly spread across canvas by taking aspect ratio into account
                MM.vec3((0.166 - Math.random() / 3) * aspectRatio, (0.166 - Math.random() / 3)),
                initEnergy,
                Math.random() * size));
        },
    };

    /**
     * Draw all the particles in the emitter
     * @param ctx
     * @param particleSet
     */
    function drawParticles(ctx, particleSet) {
        for (let i = 0, len = particleSet.length; i < len; i++) {
            const pos = particleSet[i].position;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.scale(particleSet[i].size, particleSet[i].size);
            // Make the particles fade as they near the end of their life
            ctx.globalAlpha = Math.min(particleSet[i].energy / 500, 0.75);
            ctx.drawImage(particleImage, 0, 0);
            ctx.restore();
        }
    }

    Scheduler.schedule((deltaTime) => {
        // Create new particles while we have emission energy
        while (emissionEnergy > 0) {
            emissionEnergy -= deltaTime;
            emitter.emit();
        }

        // Update particles in the emitter and filter out those with no energy left
        const nextParticles = [];
        for (let i = 0, len = particles.length; i < len; i++) {
            particles[i].update(deltaTime, speed);
            if (particles[i].energy > 0) {
                nextParticles.push(particles[i]);
            }
        }
        particles = nextParticles;

        // Draw the particles
        Scheduler.draw(() => {
            drawParticles(Easel.context, particles);
        }, 125);
    }, 100);

    return emitter;
}
