/**
 * Created by Greg on 11/2/2016.
 */

const MDT = require('./mallet.dependency-tree').MDT;

require('angular').module('mallet').service(MDT.Camera, [
    MDT.Math,
    MDT.Easel,
    MDT.Geometry,
    MDT.Color,
    MDT.Scheduler,
    MDT.State,
    Camera]);

function Camera(MM, MEasel, Geometry, Color, MScheduler, MState) {
    const Mesh = Geometry.Mesh;
    const drawCalls = new PriorityQueue();
    const self = this;

    this.getLensAngle = () => (3 / 5) * Math.PI;
        // const focalLength = 70;
        // return Math.atan(1 / focalLength);

    this.imageScale = 1 / Math.tan(self.getLensAngle() / 2);
    this.xFactor = 1;
    this.yFactor = 1;

    this.viewport = MM.vec2();
    this.screenCenter = MM.vec2();
    this.image = MM.vec2();

    this.calculateViewport = function calculateViewport(ctx) {
        this.aspectRatio = 16 / 9;
        // y is negative because screen space is inverted
        this.image.set(1 / this.aspectRatio, -1);

        this.viewport.set(ctx.canvas.width, ctx.canvas.height);
        this.screenCenter.set(this.viewport.x / 2, this.viewport.y / 2); // center of the viewport

        this.xFactor = this.image.x * this.viewport.x * this.imageScale;
        this.yFactor = this.image.y * this.viewport.y * this.imageScale;
    };

    const tCamera = new Geometry.Transform()
        .translate(0, 0, 3)
        .rotateBy(-Math.PI / 10, 0, 0);
    // position of the camera in 3d space
    this.forward = MM.vec3(0, 0, 1).normalize();
    const light = MM.vec3(-1, -1, -1).normalize();

    this.getPos = () => tCamera.position;

    this.toVertexBuffer = (verts) => {
        const vertSize = Mesh.VERT_SIZE;
        const buffer = new Float32Array(verts.length * vertSize);
        verts.forEach((vert, i) => {
            buffer[(i * vertSize)]     = vert.x;
            buffer[(i * vertSize) + 1] = vert.y;
            buffer[(i * vertSize) + 2] = vert.z;
        });
    
        return buffer;
    };

    this.timeTranslate = tCamera.timeTranslate.bind(tCamera);

    /**
     *
     * @param buffer {Float32Array}
     * @param size {Vector3}
     * @param pos {Vector3}
     * @param scale {Vector3}
     * @param rot {Vector3}
     * @param origin {Vector3}
     * @returns {*}
     */
    this.applyTransform = (buffer, size, pos, scale, rot, origin) => {
        /* eslint-disable */
        origin = origin || MM.Vector3.Zero;
        const Cx = Math.cos(rot.x),
            Cy = Math.cos(rot.y),
            Cz = Math.cos(rot.z),
            Sx = Math.sin(rot.x),
            Sy = Math.sin(rot.y),
            Sz = Math.sin(rot.z),

            scaleX = scale.x,
            scaleY = scale.y,
            scaleZ = scale.z,

            offsetX =  (origin.x * size.x / 2) * scale.x,
            offsetY =  (origin.y * size.y / 2) * scale.y,
            offsetZ =  (origin.z * size.z / 2) * scale.z,

        /*
         * Euler rotation matrix
         * http://what-when-how.com/advanced-methods-in-computer-graphics/quaternions-advanced-methods-in-computer-graphics-part-2/
         * [  Cy * Cz,  Cx * Sz + Sx * Sy * Cz, Sx * Sz - Cx * Sy * Cz ]
         * [ -Cy * Sz,  Cx * Cz - Sx * Sy * Sz, Sx * Cz + Cx * Sy * Sz ]
         * [  Sy,      -Sx * Cy,                Cx * Cy                ]
         */
            M11 = +Cy * Cz, M12a = Cx * Sz, M12b = + Sx * Sy * Cz, M13a = Sx * Sz, M13b = - Cx * Sy * Cz,
            M21 = -Cy * Sz, M22a = Cx * Cz, M22b = - Sx * Sy * Sz, M23a = Sx * Cz, M23b = + Cx * Sy * Sz,
            M31 = Sy, M32 = -Sx * Cy, M33 = Cx * Cy;

        for(let i = 0, len = buffer.length, s = Mesh.VERT_SIZE; i < len; i += s){
            const x = buffer[i]   * scaleX - offsetX,
                y = buffer[i + 1] * scaleY - offsetY,
                z = buffer[i + 2] * scaleZ - offsetZ;

            buffer[i + 0] = pos.x + (x * M11 + y * M12a + y * M12b + z * M13a + z * M13b);
            buffer[i + 1] = pos.y + (x * M21 + y * M22a + y * M22b + z * M23a + z * M23b);
            buffer[i + 2] = pos.z + (x * M31 + y * M32 + z * M33);
        }

        return buffer;
        /* eslint-enable*/
    };

    /**
     * Calculate which faces are facing the camera and should be rendered
     * @param buffer {Float32Array} a buffer of vertices
     * @param normals {Float32Array} a buffer of the normals
     * @param indices {Array|Int8Array} listing of indices that form the faces
     * @returns {Int8Array} array containing 0 (don't render) or 1 (render) for each face
     */
    this.getCulledFaces = (buffer, normals, indices) => {
        /* eslint-disable */
        const culledFaces = new Int8Array(~~(indices.length / 3));
        const vertSize = Mesh.VERT_SIZE;
        for (let i = 0, len = indices.length; i < len; i += 3) {
            const v1 = indices[i] * vertSize,
                v2 = indices[i + 1] * vertSize,
                v3 = indices[i + 2] * vertSize,

                // Get the coordinates of each point in the tri
                aX = buffer[v1], aY = buffer[v1 + 1], aZ = buffer[v1 + 2], // P1
                bX = buffer[v2], bY = buffer[v2 + 1], bZ = buffer[v2 + 2], // P2
                cX = buffer[v3], cY = buffer[v3 + 1], cZ = buffer[v3 + 2], // P3
                
                // Calculate centroid
                centroidX = (aX + bX + cX) / 3,
                centroidY = (aY + bY + cY) / 3, 
                centroidZ = (aZ + bZ + cZ) / 3,
                
                // Calculate to triangle vector
                toTriX = tCamera.position.x - centroidX,
                toTriY = tCamera.position.y - centroidY,
                toTriZ = tCamera.position.z - centroidZ;

            // Not sure if we need to normalize or not, but doesn't appear so...
            // toTriLen = Math.sqrt(toTriX * toTriX + toTriY * toTriY + toTriZ * toTriZ);

            // toTriX /= toTriLen;
            // toTriY /= toTriLen;
            // toTriZ /= toTriLen;

            const normalX = normals[i],
                normalY = normals[i + 1],
                normalZ = normals[i + 2],

                // Calculate the dot product of the displacement vector and the face normal
                dot = toTriX * normalX + toTriY * normalY + toTriZ * normalZ;

            // If the dot product is greater than or equal to zero, the face will not be rendered
            // A 0 dot product means the faces is perpendicular and will not be seen
            // A dot product of greater than one means the face is facing away from the camera
            const faceIndex = ~~(i / 3);
            culledFaces[faceIndex] = (dot >= 0) ? 0 : 1;
        }

        return culledFaces;
        /* eslint-enable*/
    };

    /**
     * Projects a point in camera space on to the render plane
     * @param pointBuffer {Float32Array}
     * @returns {[*,*,*]}
     */
    this.projectPoint = (pointBuffer) => {
        // The size of the field of view at the distance of the point
        const n = 1 / (-pointBuffer[2]);

        const screenX = (pointBuffer[0] * n * this.xFactor) + this.screenCenter.x;
        const screenY = (pointBuffer[1] * n * this.yFactor) + this.screenCenter.y;

        return [screenX, screenY, this.imageScale];
    };

    /**
     * Determines if the given position is in front of the camera
     * @param position
     * @returns {boolean}
     */
    this.isVisible = (position) => {
        const disp = MM.Vector3.subtract(tCamera.position, position);
        // check if the object is in front of the camera
        return disp.dot(self.forward) > 0;
    };

    /**
     * Projects a vertex buffer in camera space onto the render plane, and queues up the corresponding
     * draw commands.
     * @param buffer {Float32Array}
     * @param culledFaces {Int8Array}
     * @param normals {Float32Array}
     * @param indices {Int32Array}
     * @param drawQueue {PriorityQueue}
     * @param color {Vector3}
     * @returns {*|PriorityQueue}
     */
    this.projectBuffer = (buffer, culledFaces, normals, indices, drawQueue, color) => {
        /* eslint-disable */
        let faceBufferIndex = 0;
        let faceIndex = 0;
        // Each 2D project face will have 6 coordinates
        const faceBuffer = new Float32Array(6);

        drawQueue = drawQueue || new PriorityQueue();

        let avgDist = 0;
        const faceSize = 3;

        for (let i = 0, l = indices.length; i < l; i ++) {
            // If the face is facing away from the camera, don't render it
            if (culledFaces[(i - (i % faceSize)) / faceSize] === 0) {
                continue;
            }

            const b = indices[i] * Mesh.VERT_SIZE;
            // Get the displacement of the vertex
            const pX = buffer[b];
            const pY = buffer[b + 1];
            const pZ = buffer[b + 2];

            // The size of the field of view at the distance of the point
            let n = 1 / (-pZ);

            const clipDist = 0.125;
            if(pZ > -clipDist) {
                // For faces that are extremely close to or behind the camera, stretch
                // them out to the sides at a linear rate tangent to the scale curve
                // calculated above: (d ^ 2) * (d + |-d - z|)
                //
                // For large faces near the camera, this creates an effect of being
                // pulled inwards. The farther the clipping distance from the camera,
                // the more pronounced this effected will be.
                //
                // The corollary to this calculation is the clipping of all tris with
                // a centroid behind the camera (otherwise they would just extend across
                // the entire viewport)
                n = Math.pow(1 / clipDist, 2) * (clipDist + Math.abs(-clipDist - pZ));
            }

            const screenX = (pX * n * this.xFactor) + this.screenCenter.x;
            const screenY = (pY * n * this.yFactor) + this.screenCenter.y;

            avgDist += (-pZ) / faceSize;

            // Insert the screen coordinates into the screen buffer
            faceBuffer[faceBufferIndex++] = screenX;
            faceBuffer[faceBufferIndex++] = screenY;

            // Push the vertices into face buffer
            if ((i + 1) % faceSize === 0){
                if(avgDist < 0) {
                    avgDist = 0;
                    faceBufferIndex = 0;
                    continue;
                }

                faceIndex = (i - (i % faceSize)) / faceSize;

                const normalX = normals[faceIndex * 3],
                    normalY = normals[faceIndex * 3 + 1],
                    normalZ = normals[faceIndex * 3 + 2],
                    dot = light.x * normalX + light.y * normalY + light.z * normalZ,

                    ambientLight = 0.2,
                    // Clamp the light amount to 1 and make sure it is positive
                    lightAmt = Math.min(ambientLight + Math.max(0, dot), 1);

                drawQueue.enqueue(1000 - avgDist, {
                    buffer: faceBuffer.slice(),
                    end: faceSize * 2,
                    color: MM.Vector3.scale(color, lightAmt)});

                avgDist = 0;
                faceBufferIndex = 0;
            }
        }

        return drawQueue;
        /* eslint-enable*/
    };

    /**
     * Draws a set of screen vertices using canvas path
     * @param ctx
     * @param buffer {Float32Array}
     * @param end {number}
     */
    this.drawFace = (ctx, buffer, end) => {
        ctx.beginPath();
        ctx.moveTo(buffer[0], buffer[1]);

        let i = 2;
        while (i < end) {
            ctx.lineTo(buffer[i++], buffer[i++]);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    /**
     *
     * @param {Array<Image>} images
     * @param {Transform[]} transforms
     * @param {Transform} [parent]
     */
    this.billboardRender = (images, transforms, parent) => {
        // wrap a raw transform in an array
        transforms = (transforms instanceof Array) ? transforms : [transforms];
        parent = parent || new Geometry.Transform();

        // create a queue to store the draw commands generated
        const ctx = MEasel.context;

        for (let t = 0; t < transforms.length; t++) {
            if (transforms[t] === null || typeof transforms[t] !== 'object') {
                continue;
            }

            const buffer = transforms[t].position.toBuffer();
            const image = images[~~(Math.random() * images.length)];

            const screenCoords = self.projectPoint(buffer);
            const fieldScale = screenCoords[2] / 30;

            ctx.save();

            const dispX = screenCoords[0] - (image.width / 2) * fieldScale;
            const dispY = screenCoords[1] - (image.height / 2) * fieldScale;
            ctx.translate(dispX, dispY);
            ctx.scale(
                transforms[t].scale.x * parent.scale.x * fieldScale,
                transforms[t].scale.y * parent.scale.y * fieldScale);
            // Make the particles fade as they near the end of their life
            // ctx.globalAlpha = Math.min(particles[i].energy / 500, .75);
            ctx.drawImage(image, 0, 0);
            ctx.restore();
        }
    };

    /**
     * Render an instance of the mesh for each transform provided, with the given color
     * @param mesh {Mesh}
     * @param transforms {Transform|Array<Transform>}
     * @param color {Vector3}
     */
    this.render = (mesh, transforms, color) => {
        // wrap a raw transform in an array
        transforms = (transforms instanceof Array) ? transforms : [transforms];
        // create a queue to store the draw commands generated

        const vOne = MM.Vector3.One;
        const vZero = MM.Vector3.Zero;
        for (let t = 0; t < transforms.length; t++) {
            if (transforms[t] === null || typeof transforms[t] !== 'object') {
                continue;
            }

            // Don't render things that are behind the camera
            // TODO: this needs to be changed be based off camera camera position/perspective
            if (!this.isVisible(transforms[t].position)) {
                if (MState.is(MState.Debug)) { // TODO: add logging levels (this would be VERY verbose)
                    // console.warn('Mesh at ' + transforms[t].position + ' was skipped');
                }

                // continue;
            }

            // Get a transformed vertex buffer for the mesh
            const buffer = self.applyTransform(
                mesh.getVertexBuffer(),
                mesh.size,
                transforms[t].position,
                transforms[t].scale,
                transforms[t].rotation,
                transforms[t].origin);

            this.applyTransform(
                buffer,
                vOne,
                MM.Vector3.scale(tCamera.position, -1),
                vOne,
                tCamera.rotation,
                vZero);

            // Generate a buffer of the transformed face normals
            const normalsBuffer = self.applyTransform(
                self.toVertexBuffer(mesh.normals),
                vZero,
                vZero,
                vOne,
                transforms[t].rotation,
                vZero);

            this.applyTransform(
                normalsBuffer,
                vZero,
                vZero,
                vOne,
                tCamera.rotation,
                vZero);

            // Determine which faces will be cull (don't render back faces)
            const culledFaces = self.getCulledFaces(buffer, normalsBuffer, mesh.indices);

            // Project the buffer into the camera's viewport
            self.projectBuffer(buffer, culledFaces, normalsBuffer, mesh.indices, drawCalls, color);
        }
    };

   this.present = () => {
        const ctx = MEasel.context;
        let face;
        ctx.lineWidth = 1;
        // Execute each draw call to display the scene
        while (drawCalls.peek() !== null) {
            face = drawCalls.dequeue();
            // Apply lighting calculations to the mesh color
            ctx.fillStyle = Color.rgbaFromVector(face.color);
            ctx.strokeStyle = Color.rgbaFromVector(face.color);
            // Draw the face
            self.drawFace(MEasel.context, face.buffer, face.end);
        }
   };

   this.init = () => {
       MScheduler.schedule(() => {
           self.calculateViewport(MEasel.context);
           MScheduler.draw(self.present, 0);
       });
   };
}
