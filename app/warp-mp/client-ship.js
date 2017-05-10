/**
 * Created by gjr8050 on 3/9/2017.
 */

const GameEvent = require('event-types').GameEvent;
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const DataFormat = require('game-params').DataFormat;
const EntityType = require('entity-types').EntityType;

module.exports = {shipFactory,
resolve: ADT => [
    ADT.network.NetworkEntity,
    ADT.network.Connection,
    MDT.Geometry,
    MDT.Math,
    ADT.game.LerpedEntity,
    ADT.game.Render,
    shipFactory]};

/**
 *
 * @param NetworkEntity
 * @param Connection
 * @param Geometry
 * @param MM
 * @param LerpedEntity
 * @param Render
 * @returns {ClientShip}
 */
function shipFactory(NetworkEntity, Connection, Geometry, MM, LerpedEntity, Render) {
    class ClientShip extends LerpedEntity {
        constructor(params, id) {
            super(id, DataFormat.SHIP);

            this.disp = MM.vec3(0);

            this.tPrev = new Geometry.Transform();
            this.tDest = new Geometry.Transform();
            this.tRender = new Geometry.Transform()
                .translate(0, 0.2, 2)
                .scaleBy(0.5, 0.35, 0.5)
                .rotateBy(-Math.PI / 9, 0, 0);

            this.updateTS = 0;
            this.color = MM.vec3(255, 255, 255);
            this.bankPct = 0;

            Object.defineProperty(this, 'positionX', {
                writeable: true,
                set(value) {
                    this.tPrev.position.x = this.tDest.position.x;
                    this.tDest.position.x = value;
                    },
            });
        }

        getColor() {
            return this.color;
        }

        sync(buffer, bufferString) {
            super.sync(buffer, bufferString);
            this.disp = MM.Vector3.subtract(this.tDest.position, this.tPrev.position);
        }

        // eslint-disable-next-line
        strafe(direction) {
            Connection.getSocket().get().emit(GameEvent.command, direction);
        }

        getRotation(dt, pos) {
            const newRot = MM.vec3();
            const bankRate = 0.008;
            const bankAngle = MM.vec3(Math.PI / 12, Math.PI / 24, Math.PI / 4);

            if (this.disp.len2() > 0) {
                const sign = Math.sign(this.disp.x);
                this.bankPct += dt * sign * bankRate;
            } else if (this.bankPct !== 0) {
                const sign =  Math.sign(this.bankPct);
                this.bankPct -= dt * bankRate * sign;

                const newSign =  Math.sign(this.bankPct);
                if (newSign !== sign) {
                    this.bankPct = 0;
                }
            }

            this.bankPct = MM.clamp(this.bankPct, -1, 1);

            newRot.x = this.tRender.rotation.x;
            newRot.y = bankAngle.y * this.bankPct;
            newRot.z = bankAngle.z * this.bankPct;

            // eslint-disable-next-line no-constant-condition
            if (pos && false) {
                newRot.x += 1;
            }

            return newRot;
        }
        
        update(dt) {
            super.update(dt);
            const pos = LerpedEntity.lerpVector(this.tPrev.position, this.disp, this.lerpPct);
            pos.y = 0.2;
            pos.z = 0.8;
            this.tRender.position.set(Render.reMapPosition(pos));
            this.tRender.rotation.set(this.getRotation(dt, pos));
        }

        getTransform() {
            return this.tRender;
        }
    }

    NetworkEntity.registerType(ClientShip, EntityType.Ship);

    return ClientShip;
}
