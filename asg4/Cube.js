class Cube {
    constructor() {
        this.vertices = null;
        this.uvs = null;
        this.vertexBuffer = null;
        this.uvBuffer = null;
        this.normalBuffer = null;

        this.color = [1.0, 1.0, 1.0, 1.0];
        this.solidColorWeight = 0.0;

        this.position = new Vector3([0, 0, 0]);
        this.rotation = new Vector3([0, 0, 0]);
        this.scale = new Vector3([1, 1, 1]);
        this.modelMatrix = new Matrix4();
        this.normalMatrix = new Matrix4();

        this.setVertices();
        this.setUvs();
        this.setNormals();
    }

    static texture0 = null;
    static texture1 = null;
    static texture2 = null;

    setVertices() {
        // prettier-ignore
        this.vertices = new Float32Array([
            //FRONT
            -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5,
            //LEFT
            -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5,
            -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5,
            //RIGHT
            0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,
            0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5,
            //TOP
            -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,
            //BACK
            0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
            //BOTTOM
            -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5
        ]);
    }

    setUvs() {
        // prettier-ignore
        this.uvs = new Float32Array([
            // FRONT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // LEFT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // RIGHT
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
            // TOP
            1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0,
            // BACK
            0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0,
            // BOTTOM
            0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1,
        ]);
    }

    setNormals() {
        // prettier-ignore
        this.normals = new Float32Array([
            //FRONT
            0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5,
            0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5,
            //LEFT
            -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0,
            -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0,
            //RIGHT
            0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0,
            0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0,
            //TOP
            0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0,
            0.0, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, 0.5, 0.0,
            //BACK
            0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5,
            0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5,
            //BOTTOM
            0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0,
            0.0, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, -0.5, 0.0
        ]);
    }

    calculateMatrix() {
        let [x, y, z] = this.position.elements;
        let [rx, ry, rz] = this.rotation.elements;
        let [sx, sy, sz] = this.scale.elements;

        this.modelMatrix
            .setTranslate(x, y, z)
            .rotate(rx, 1, 0, 0)
            .rotate(ry, 0, 1, 0)
            .rotate(rz, 0, 0, 1)
            .scale(sx, sy, sz);

        this.normalMatrix
            .setInverseOf(this.modelMatrix)
            .transpose();
    }

    render(gl, camera) {
        this.calculateMatrix();

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
        gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
        gl.uniformMatrix4fv(
            u_ProjectionMatrix,
            false,
            camera.projectionMatrix.elements
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // VERTS
        if (this.vertexBuffer === null) {
            this.vertexBuffer = gl.createBuffer();
            if (!this.vertexBuffer) {
                console.log("Failed to create the buffer object");
                return -1;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // NROMS
        if (this.normalBuffer === null) {
            this.normalBuffer = gl.createBuffer();
            if (!this.normalBuffer) {
                console.log("Failed to create the buffer object");
                return -1;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // UVS
        if (this.uvBuffer === null) {
            this.uvBuffer = gl.createBuffer();
            if (!this.uvBuffer) {
                console.log("Failed to create the buffer object");
                return -1;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniform1f(u_ColorWeight, this.solidColorWeight);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }


    static setTexture0(gl, imagePath) {
        if (Cube.texture0 === null) {
            Cube.texture0 = gl.createTexture();
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // check pntr to shdr unifrnm var
        if (u_Texture0 < 0) {
            console.warn("could not find uniform location");
        }

        const img = new Image();

        img.onload = () => {
            gl.activeTexture(gl.TEXTURE0);

            gl.bindTexture(gl.TEXTURE_2D, Cube.texture0);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            // set uniform to texture slot (match 32)
            gl.uniform1i(u_Texture0, 0);
        };

        img.crossOrigin = "anonymous";
        img.src = imagePath;
    }

    static setTexture1(gl, imagePath) {
        if (Cube.texture1 === null) {
            Cube.texture1 = gl.createTexture();
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // check pntr to shdr unifrnm var
        if (u_Texture1 < 0) {
            console.warn("could not find uniform location");
        }

        const img = new Image();

        img.onload = () => {
            gl.activeTexture(gl.TEXTURE1);

            gl.bindTexture(gl.TEXTURE_2D, Cube.texture1);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            // set uniform to texture slot (match 32)
            gl.uniform1i(u_Texture1, 1);
        };

        img.crossOrigin = "anonymous";
        img.src = imagePath;
    }

    static setTexture2(gl, imagePath) {
        if (Cube.texture2 === null) {
            Cube.texture2 = gl.createTexture();
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        // check pntr to shdr unifrnm var
        if (u_Texture2 < 0) {
            console.warn("could not find uniform location");
        }

        const img = new Image();

        img.onload = () => {
            gl.activeTexture(gl.TEXTURE2);

            gl.bindTexture(gl.TEXTURE_2D, Cube.texture2);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            );

            // set uniform to texture slot (match 32)
            gl.uniform1i(u_Texture2, 2);
        };

        img.crossOrigin = "anonymous";
        img.src = imagePath;
    }
}