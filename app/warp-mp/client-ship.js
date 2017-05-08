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
    ADT.game.const.UITrack,
    shipFactory]};

/**
 *
 * @param NetworkEntity
 * @param Connection
 * @param Geometry
 * @param MM
 * @param LerpedEntity
 * @param UITrack
 * @returns {ClientShip}
 */
function shipFactory(NetworkEntity, Connection, Geometry, MM, LerpedEntity, UITrack) {
    /**
     * Ramp the ship up the side of the lanes
     * @param x
     */
    function getYPos(x) {
        const rampLBound = UITrack.POSITION_X + UITrack.LANE_WIDTH / 2;
        const rampRBound = UITrack.POSITION_X + UITrack.WIDTH - UITrack.LANE_WIDTH / 2;

        if (x >= rampLBound && x <= rampRBound) {
            return 0.2;
        }

        const flatWidth = UITrack.WIDTH - UITrack.LANE_WIDTH;
        const trackCenter = UITrack.POSITION_X + UITrack.WIDTH / 2;
        const relX = Math.abs(x - trackCenter) - (flatWidth / 2);

        const r = UITrack.LANE_WIDTH * 3; // arc radius
        return 1.2 + Math.sin((3 / 2) * Math.PI + (relX / r) * Math.PI / 2);
    }

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
        
        update(dt) {
            super.update(dt);
            this.tRender.position.set(LerpedEntity.lerpVector(this.tPrev.position, this.disp, this.lerpPct));
            this.tRender.position.y = getYPos(this.tRender.position.x);
            this.tRender.position.z = 0.8;
        }

        getTransform() {
            return this.tRender;
        }
    }

    NetworkEntity.registerType(ClientShip, EntityType.Ship);

    return ClientShip;
}
