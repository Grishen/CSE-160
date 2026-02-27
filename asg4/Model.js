// Model.js
class Model {
  constructor(objPath, scale = 1.0) {
    this.vertexBuffer = null;
    this.normalBuffer = null;
    this.uvBuffer = null;

    this.numVertices = 0;
    this.ready = false;

    this.position = new Vector3([0, 0, 0]);
    this.rotation = new Vector3([0, 0, 0]);
    this.scale = new Vector3([scale, scale, scale]);
    this.modelMatrix = new Matrix4();
    this.normalMatrix = new Matrix4();

    this.color = [1.0, 1.0, 1.0, 1.0];
    this.solidColorWeight = 1.0; // flat color by default

    this.loadOBJ(objPath);
  }

  loadOBJ(objPath) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4 && request.status === 200) {
        this.onOBJLoaded(request.responseText);
      }
    };
    request.open('GET', objPath, true);
    request.send();
  }

  onOBJLoaded(fileString) {
    // This uses the lab’s OBJ loader classes (OBJDoc)
    const objDoc = new OBJDoc('model');
    const result = objDoc.parse(fileString, 1.0, true);
    if (!result) {
      console.log('Failed to parse OBJ file');
      return;
    }

    // Build interleaved arrays for positions, normals, and UVs
    const drawingInfo = objDoc.getDrawingInfo();

    this.vertices = new Float32Array(drawingInfo.vertices);
    this.normals  = new Float32Array(drawingInfo.normals);
    this.uvs      = new Float32Array(drawingInfo.texCoords);
    this.numVertices = drawingInfo.indices.length;

    this.indices = new Uint16Array(drawingInfo.indices);

    // Create buffers
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.uvBuffer     = gl.createBuffer();
    this.indexBuffer  = gl.createBuffer();

    if (!this.vertexBuffer || !this.normalBuffer || !this.uvBuffer || !this.indexBuffer) {
      console.log('Failed to create buffers for OBJ model');
      return;
    }

    // Upload data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    if (this.uvs && this.uvs.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    this.ready = true;
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
    if (!this.ready) return; // wait until OBJ is loaded

    this.calculateMatrix();

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

    // Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // UVs (if present)
    if (this.uvs && this.uvs.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);
    } else {
      gl.disableVertexAttribArray(a_UV);
    }

    // Color (Phong will light this)
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniform1f(u_ColorWeight, this.solidColorWeight);

    // This model is not using textures → select flat color
    if (g_normalOn) {
      gl.uniform1i(u_SelectedTexture, -1); // normal visualization
    } else {
      gl.uniform1i(u_SelectedTexture, -999); // flat color
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.numVertices, gl.UNSIGNED_SHORT, 0);
  }
}
