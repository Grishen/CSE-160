class Sphere {
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
        this.setNormals();
        // this.setUvs();
    }

    setVertices() {
        // prettier-ignore
        this.vertices = [];
        let d = Math.PI / 100;
        let dd = Math.PI / 100;
        for (let t = 0; t < Math.PI; t += d) {
            for (let r = 0; r < (2 * Math.PI); r += d) {
                let p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];

                let p2 = [Math.sin(t + dd) * Math.cos(r), Math.sin(t + dd) * Math.sin(r), Math.cos(t + dd)];
                let p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
                let p4 = [Math.sin(t + dd) * Math.cos(r + dd), Math.sin(t + dd) * Math.sin(r + dd), Math.cos(t + dd)];

                this.vertices.push(p1[0]);
                this.vertices.push(p1[1]);
                this.vertices.push(p1[2]);
                this.vertices.push(p2[0]);
                this.vertices.push(p2[1]);
                this.vertices.push(p2[2]);
                this.vertices.push(p4[0]);
                this.vertices.push(p4[1]);
                this.vertices.push(p4[2]);
                this.vertices.push(p1[0]);
                this.vertices.push(p1[1]);
                this.vertices.push(p1[2]);
                this.vertices.push(p4[0]);
                this.vertices.push(p4[1]);
                this.vertices.push(p4[2]);
                this.vertices.push(p3[0]);
                this.vertices.push(p3[1]);
                this.vertices.push(p3[2]);
            }
        }
    }

    setNormals() {
        // prettier-ignore
        this.normals = this.vertices;
    }

    // setUvs() {
    //     this.uvs = [];
    //     let d = Math.PI / 100;
    //     for (let t = 0; t < Math.PI; t += d) {
    //         for (let r = 0; r < (2 * Math.PI); r += d) {
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);
    //             this.uvs.push(0.0);

    //         }
    //     }
    // }

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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.DYNAMIC_DRAW);
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // // UVS
        // if (this.uvBuffer === null) {
        //     this.uvBuffer = gl.createBuffer();
        //     if (!this.uvBuffer) {
        //         console.log("Failed to create the buffer object");
        //         return -1;
        //     }
        // }

        // gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.DYNAMIC_DRAW);
        // gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        // gl.enableVertexAttribArray(a_UV);
        gl.disableVertexAttribArray(a_UV);

        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniform1f(u_ColorWeight, this.solidColorWeight);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}