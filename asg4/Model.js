// Model.js
// Self-contained OBJ loader (no OBJDoc needed)
// Supports: v, vt, vn, f (triangles + quads; quads triangulated)
// Faces can be: v/vt/vn, v//vn, v/vt, v
// Uses drawArrays (expands faces to flat arrays)

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
    this.solidColorWeight = 1.0;

    this.loadOBJ(objPath);
  }

  loadOBJ(objPath) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          this.onOBJLoaded(request.responseText);
        } else {
          console.log("OBJ load failed:", objPath, "status:", request.status);
        }
      }
    };
    request.open("GET", objPath, true);
    request.send();
  }

  onOBJLoaded(fileString) {
    const parsed = this.parseOBJ(fileString);

    this.vertices = new Float32Array(parsed.vertices);
    this.normals = new Float32Array(parsed.normals);
    this.uvs = new Float32Array(parsed.uvs);

    this.numVertices = this.vertices.length / 3;

    // Create buffers
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.uvBuffer = gl.createBuffer();

    if (!this.vertexBuffer || !this.normalBuffer || !this.uvBuffer) {
      console.log("Failed to create buffers for OBJ model");
      return;
    }

    // Upload to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    this.ready = true;
    console.log("OBJ loaded. Triangles:", this.numVertices / 3);
  }

  // Convert OBJ index (1-based, can be negative) to 0-based
  fixIndex(i, len) {
    if (i === undefined || i === null || i === "") return null;
    const n = parseInt(i, 10);
    if (Number.isNaN(n)) return null;
    if (n > 0) return n - 1;
    // negative index: -1 means last
    return len + n;
  }

  parseOBJ(text) {
    const positions = [];
    const texcoords = [];
    const normals = [];

    const outVerts = [];
    const outUVs = [];
    const outNorms = [];

    const lines = text.split("\n");

    const addVertex = (vIdx, vtIdx, vnIdx) => {
      // position
      outVerts.push(
        positions[vIdx * 3 + 0],
        positions[vIdx * 3 + 1],
        positions[vIdx * 3 + 2]
      );

      // uv (if missing, push 0,0)
      if (vtIdx !== null && vtIdx !== undefined) {
        outUVs.push(
          texcoords[vtIdx * 2 + 0],
          texcoords[vtIdx * 2 + 1]
        );
      } else {
        outUVs.push(0.0, 0.0);
      }

      // normal (if missing, push 0,1,0)
      if (vnIdx !== null && vnIdx !== undefined) {
        outNorms.push(
          normals[vnIdx * 3 + 0],
          normals[vnIdx * 3 + 1],
          normals[vnIdx * 3 + 2]
        );
      } else {
        outNorms.push(0.0, 1.0, 0.0);
      }
    };

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const parts = line.split(/\s+/);
      const kw = parts[0];

      if (kw === "v") {
        positions.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
      } else if (kw === "vt") {
        // vt u v
        texcoords.push(parseFloat(parts[1]), parseFloat(parts[2]));
      } else if (kw === "vn") {
        normals.push(
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3])
        );
      } else if (kw === "f") {
        // faces: parts[1..]
        // each vertex token: v/vt/vn or v//vn or v/vt or v
        const face = parts.slice(1).map(tok => {
          const [v, vt, vn] = tok.split("/");
          const vIdx = this.fixIndex(v, positions.length / 3);
          const vtIdx = this.fixIndex(vt, texcoords.length / 2);
          const vnIdx = this.fixIndex(vn, normals.length / 3);
          return { vIdx, vtIdx, vnIdx };
        });

        // triangulate fan: (0, i, i+1)
        for (let i = 1; i + 1 < face.length; i++) {
          const a = face[0], b = face[i], c = face[i + 1];
          addVertex(a.vIdx, a.vtIdx, a.vnIdx);
          addVertex(b.vIdx, b.vtIdx, b.vnIdx);
          addVertex(c.vIdx, c.vtIdx, c.vnIdx);
        }
      }
    }

    return { vertices: outVerts, uvs: outUVs, normals: outNorms };
  }

  calculateMatrix() {
    const [x, y, z] = this.position.elements;
    const [rx, ry, rz] = this.rotation.elements;
    const [sx, sy, sz] = this.scale.elements;

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
    if (!this.ready) return;

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

    // UVs
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Color
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_ColorWeight, this.solidColorWeight);

    // For your shader: select flat color unless normals view is on
    if (typeof g_normalOn !== "undefined" && g_normalOn) {
      gl.uniform1i(u_SelectedTexture, -1);
    } else {
      gl.uniform1i(u_SelectedTexture, -999);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
  }
}