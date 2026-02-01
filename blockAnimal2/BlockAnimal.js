// main.js

// ===== Shaders =====
const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotation; // Added for Rubric
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_NormalMatrix;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;
uniform vec3 u_AmbientColor;
uniform vec3 u_Color;

varying vec3 v_Color;

void main() {
  // Rubric Requirement: glPosition = u_GlobalRotation * uModelMatrix * a_position
  // (View and Proj added for 3D depth)
  gl_Position = u_ProjMatrix * u_ViewMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;

  vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
  float nDotL = max(dot(normal, normalize(u_LightDirection)), 0.0);
  vec3 diffuse = u_LightColor * u_Color * nDotL;
  vec3 ambient = u_AmbientColor * u_Color;

  v_Color = diffuse + ambient;
}
`;

const FSHADER_SOURCE = `
precision mediump float;
varying vec3 v_Color;
void main() {
  gl_FragColor = vec4(v_Color, 1.0);
}
`;

// ===== GL / uniforms =====
let gl;
let a_Position, a_Normal;
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix, u_GlobalRotation;
let u_Color, u_LightDirection, u_LightColor, u_AmbientColor;

// UI State
let g_globalAngle = 0;
let g_headAngle = 0;
let g_legAngle = 0;
let g_footAngle = 0;
let g_animation = true;

// Geometry / Animation
let cubeBuffers = null;
let cylinderBuffers = null;
let g_time = 0;
let g_lastTime = performance.now();

// Add these global matrix declarations:
const g_viewMatrix = new Matrix4();
const g_projMatrix = new Matrix4();
const g_normalMatrix = new Matrix4();

// Poke animation
let g_pokeActive = false;
let g_pokeStartTime = 0;
const POKE_DURATION = 1.0;

// Camera orbit state
let g_camYaw = 45;     // degrees
let g_camPitch = 20;   // degrees
let g_camRadius = 12;  // distance from origin
let g_dragging = false;
let g_lastX = 0;
let g_lastY = 0;

// ===== Entry =====
window.onload = main;

function main() {
  const canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl');
  if (!gl || !initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return;

  gl.enable(gl.DEPTH_TEST);

  // Link variables
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');

  // Setup UI Actions
  addActionsForHtmlUI();

  // Initial Matrices
  g_projMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix, false, g_projMatrix.elements);
  gl.uniform3f(u_LightDirection, 0.5, 1.0, 0.7);
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(u_AmbientColor, 0.22, 0.22, 0.22);

  cubeBuffers = initCubeBuffers();
  cylinderBuffers = initCylinderBuffers();
  initMouse(canvas);
  requestAnimationFrame(tick);
}

function addActionsForHtmlUI() {
  document.getElementById('animOn').onclick = () => g_animation = true;
  document.getElementById('animOff').onclick = () => g_animation = false;
  
  document.getElementById('angleSlide').oninput = function() { g_globalAngle = this.value; renderScene(); };
  document.getElementById('headSlide').oninput = function() { g_headAngle = this.value; renderScene(); };
  document.getElementById('legSlide').oninput = function() { g_legAngle = this.value; renderScene(); };
  document.getElementById('footSlide').oninput = function() { g_footAngle = this.value; renderScene(); };
}

// ===== Geometry =====
function initCubeBuffers() {
  const vertices = new Float32Array([
    // front
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,
    // back
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,
    // top
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,
    -0.5,  0.5, -0.5,
    // bottom
    -0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    // right
     0.5, -0.5,  0.5,
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
    // left
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,
  ]);

  const normals = new Float32Array([
    // front
     0,  0,  1,
     0,  0,  1,
     0,  0,  1,
     0,  0,  1,
    // back
     0,  0, -1,
     0,  0, -1,
     0,  0, -1,
     0,  0, -1,
    // top
     0,  1,  0,
     0,  1,  0,
     0,  1,  0,
     0,  1,  0,
    // bottom
     0, -1,  0,
     0, -1,  0,
     0, -1,  0,
     0, -1,  0,
    // right
     1,  0,  0,
     1,  0,  0,
     1,  0,  0,
     1,  0,  0,
    // left
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0,
    -1,  0,  0,
  ]);

  const indices = new Uint16Array([
     0,  1,  2,  0,  2,  3,
     4,  5,  6,  4,  6,  7,
     8,  9, 10,  8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23
  ]);

  const vertexBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return {
    vertexBuffer,
    normalBuffer,
    indexBuffer,
    numIndices: indices.length,
  };
}

function initCylinderBuffers() {
  const slices = 24;
  const vertices = [];
  const normals = [];
  const indices = [];

  const r = 0.5;
  const h = 1.0;
  const halfH = h / 2;

  for (let i = 0; i <= slices; i++) {
    const theta = (i / slices) * 2 * Math.PI;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    vertices.push(x, halfH, z);
    normals.push(x, 0, z);

    vertices.push(x, -halfH, z);
    normals.push(x, 0, z);
  }

  for (let i = 0; i < slices; i++) {
    const top1 = i * 2;
    const bot1 = top1 + 1;
    const top2 = (i + 1) * 2;
    const bot2 = top2 + 1;
    indices.push(top1, bot1, top2);
    indices.push(top2, bot1, bot2);
  }

  const vertexBuffer = gl.createBuffer();
  const normalBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    vertexBuffer,
    normalBuffer,
    indexBuffer,
    numIndices: indices.length,
  };
}

// ===== Draw helpers =====
function drawCube(M, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  g_normalMatrix.setInverseOf(M);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  gl.uniform3f(u_Color, color[0], color[1], color[2]);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffers.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cubeBuffers.numIndices, gl.UNSIGNED_SHORT, 0);
}

function drawCylinder(M, color) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  g_normalMatrix.setInverseOf(M);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  gl.uniform3f(u_Color, color[0], color[1], color[2]);

  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderBuffers.vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, cylinderBuffers.normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cylinderBuffers.indexBuffer);
  gl.drawElements(gl.TRIANGLES, cylinderBuffers.numIndices, gl.UNSIGNED_SHORT, 0);
}

function renderScene() {
  // Requirement: Clear color and depth
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Requirement: Global rotation matrix from slider
  let globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotMat.elements);

  updateViewMatrix();
  drawLion();
}

function drawLion() {
  // --- Color Palette ---
  const bodyColor = [0.90, 0.72, 0.30];  // Golden Yellow
  const maneColor  = [0.55, 0.30, 0.10]; // Dark Brown
  const bellyColor = [0.98, 0.90, 0.65]; // Cream
  const noseColor  = [0.25, 0.15, 0.15]; // Charcoal
  const eyeColor   = [0.1, 0.1, 0.1];    // Black
  const legColor   = [0.86, 0.70, 0.32]; // Saturated Gold

  // Base transformation: Grounding the animal
  const base = new Matrix4();
  base.setTranslate(0, -0.2, 0); 
  base.scale(0.45, 0.45, 0.45); 

  // ===== 1. THE BODY =====
  const body = new Matrix4(base);
  body.scale(3.2, 1.2, 1.4);
  drawCube(body, bodyColor);

  // Chest/Belly fluff
  const belly = new Matrix4(base);
  belly.translate(0.5, -0.4, 0);
  belly.scale(2.2, 0.5, 1.2);
  drawCube(belly, bellyColor);

  // ===== 2. THE HEAD HIERARCHY (Level 1) =====
  const headBase = new Matrix4(base);
  headBase.translate(2.0, 0.6, 0.0);
  headBase.rotate(g_headAngle, 0, 1, 0); // Controlled by slider/animation

  // Main Head Cube
  const head = new Matrix4(headBase);
  head.scale(1.1, 1.0, 1.0);
  drawCube(head, bodyColor);

  // Muzzle (Child of Head)
  const muzzle = new Matrix4(headBase);
  muzzle.translate(0.6, -0.2, 0);
  muzzle.scale(0.8, 0.6, 0.8);
  drawCube(muzzle, bellyColor);

  // Nose (Child of Head)
  const nose = new Matrix4(headBase);
  nose.translate(1.0, 0.0, 0);
  nose.scale(0.2, 0.2, 0.3);
  drawCube(nose, noseColor);

  // Eyes (Child of Head)
  const leftEye = new Matrix4(headBase);
  leftEye.translate(0.55, 0.25, 0.25);
  leftEye.scale(0.1, 0.1, 0.1);
  drawCube(leftEye, eyeColor);

  const rightEye = new Matrix4(headBase);
  rightEye.translate(0.55, 0.25, -0.25);
  rightEye.scale(0.1, 0.1, 0.1);
  drawCube(rightEye, eyeColor);

  // ===== 3. THE MANE (Requirement: Non-cube primitive) =====
  // Using cylinders for a "shaggy" look around the neck
  const maneCore = new Matrix4(headBase);
  maneCore.rotate(90, 0, 0, 1);
  maneCore.translate(0, -0.2, 0);
  maneCore.scale(1.8, 1.2, 1.8);
  drawCylinder(maneCore, maneColor);

  // ===== 4. LEGS HIERARCHY (3-Levels Deep) =====
  // Logic: Thigh (base) -> Calf (child) -> Foot (grandchild)
  
  // Front Right
  drawHierarchicalLeg(base, 1.1, -0.6, g_legAngle, g_footAngle, legColor);
  // Front Left (offset phase for walking)
  drawHierarchicalLeg(base, 1.1, 0.6, -g_legAngle, -g_footAngle, legColor);
  // Back Right
  drawHierarchicalLeg(base, -1.2, -0.6, -g_legAngle, g_footAngle, legColor);
  // Back Left
  drawHierarchicalLeg(base, -1.2, 0.6, g_legAngle, -g_footAngle, legColor);

  // ===== 5. THE TAIL HIERARCHY (3-Levels Deep) =====
  let tAngle = 20 + (g_animation ? Math.sin(g_time * 5) * 20 : 0);
  
  // Tail Level 1: Root
  const tail1 = new Matrix4(base);
  tail1.translate(-1.6, 0.4, 0);
  tail1.rotate(tAngle, 0, 0, 1);
  const m1 = new Matrix4(tail1);
  m1.scale(1.0, 0.15, 0.15);
  m1.translate(-0.5, 0, 0);
  drawCube(m1, bodyColor);

  // Tail Level 2: Mid
  const tail2 = new Matrix4(tail1);
  tail2.translate(-1.0, 0, 0);
  tail2.rotate(tAngle * 1.2, 0, 1, 0); // Wiggle side to side
  const m2 = new Matrix4(tail2);
  m2.scale(1.0, 0.12, 0.12);
  m2.translate(-0.5, 0, 0);
  drawCube(m2, bodyColor);

  // Tail Level 3: Tuft
  const tail3 = new Matrix4(tail2);
  tail3.translate(-1.0, 0, 0);
  tail3.rotate(tAngle * 0.5, 0, 0, 1);
  const m3 = new Matrix4(tail3);
  m3.scale(0.5, 0.3, 0.3);
  m3.translate(-0.5, 0, 0);
  drawCube(m3, maneColor);
}

/**
 * Helper to satisfy the 3-level joint requirement: Thigh -> Calf -> Foot
 */
function drawHierarchicalLeg(base, tx, tz, angle1, angle2, color) {
  // 1. Thigh
  const thigh = new Matrix4(base);
  thigh.translate(tx, -0.4, tz);
  thigh.rotate(angle1, 0, 0, 1);
  const m1 = new Matrix4(thigh);
  m1.scale(0.4, 0.9, 0.4);
  m1.translate(0, -0.5, 0);
  drawCube(m1, color);

  // 2. Calf (Child of Thigh)
  const calf = new Matrix4(thigh);
  calf.translate(0, -0.9, 0);
  calf.rotate(Math.abs(angle1) * 0.5, 0, 0, 1); 
  const m2 = new Matrix4(calf);
  m2.scale(0.3, 0.7, 0.3);
  m2.translate(0, -0.5, 0);
  drawCube(m2, color);

  // 3. Foot (Child of Calf)
  const foot = new Matrix4(calf);
  foot.translate(0, -0.7, 0);
  foot.rotate(angle2, 0, 0, 1);
  const m3 = new Matrix4(foot);
  m3.scale(0.5, 0.2, 0.4);
  m3.translate(0.2, -0.5, 0);
  drawCube(m3, [0.95, 0.85, 0.7]); // Paw color
}

/**
 * Helper to draw a hierarchical leg (3 segments)
 * Satisfies the Thigh -> Calf -> Foot requirement.
 */
function drawLeg(base, tx, tz, angle1, angle2, lColor, pColor) {
  // LEVEL 1: Thigh
  const thigh = new Matrix4(base);
  thigh.translate(tx, -0.4, tz);
  thigh.rotate(angle1, 0, 0, 1);
  const thighModel = new Matrix4(thigh);
  thighModel.scale(0.3, 0.8, 0.3);
  thighModel.translate(0, -0.5, 0);
  drawCube(thighModel, lColor);

  // LEVEL 2: Calf (Child of Thigh)
  const calf = new Matrix4(thigh);
  calf.translate(0, -0.8, 0);
  calf.rotate(Math.abs(angle1) * 0.7, 0, 0, 1); 
  const calfModel = new Matrix4(calf);
  calfModel.scale(0.25, 0.6, 0.25);
  calfModel.translate(0, -0.5, 0);
  drawCube(calfModel, lColor);

  // LEVEL 3: Foot (Child of Calf)
  const foot = new Matrix4(calf);
  foot.translate(0, -0.6, 0);
  foot.rotate(angle2, 0, 0, 1);
  const footModel = new Matrix4(foot);
  footModel.scale(0.4, 0.2, 0.5);
  footModel.translate(0.1, -0.5, 0.2);
  drawCube(footModel, pColor);
}

function tick(nowMs) {
  const now = nowMs || performance.now();
  const dt = (now - g_lastTime) / 1000.0;
  g_lastTime = now;
  g_time += dt;

  // Performance monitoring
  document.getElementById('fps').innerText = `FPS: ${Math.round(1/dt)}`;

  updateAnimationAngles(); 
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    // Only update these if animation is ON, otherwise they use slider values
    g_headAngle = Math.sin(g_time * 1.3) * 10;
    g_legAngle = Math.sin(g_time * 2.5) * 25;
    g_footAngle = Math.sin(g_time * 2.5 + Math.PI/2) * 15;
  }
}

function updateAnimation(dt) {
  // only handle poke timing here
  if (g_pokeActive) {
    const elapsed = g_time - g_pokeStartTime;
    if (elapsed > POKE_DURATION) {
      g_pokeActive = false;
    }
  }
}

// ===== Camera / mouse controls =====
function initMouse(canvas) {
  canvas.addEventListener('mousedown', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    g_dragging = true;
    g_lastX = x;
    g_lastY = y;

    // Shift+click triggers poke animation
    if (ev.shiftKey) {
      g_pokeActive = true;
      g_pokeStartTime = g_time;
    }
  });

  canvas.addEventListener('mouseup', () => {
    g_dragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    g_dragging = false;
  });

  canvas.addEventListener('mousemove', (ev) => {
    if (!g_dragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;

    const dx = x - g_lastX;
    const dy = y - g_lastY;
    g_lastX = x;
    g_lastY = y;

    const ROT_SPEED = 0.3;
    g_camYaw += dx * ROT_SPEED;
    g_camPitch += dy * ROT_SPEED;

    // clamp pitch to avoid flipping
    if (g_camPitch > 89) g_camPitch = 89;
    if (g_camPitch < -89) g_camPitch = -89;

    updateViewMatrix();
  });

  // Scroll to zoom
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY || ev.wheelDelta;
    const ZOOM_SPEED = 0.01;
    g_camRadius += delta * ZOOM_SPEED;
    if (g_camRadius < 4) g_camRadius = 4;
    if (g_camRadius > 30) g_camRadius = 30;
    updateViewMatrix();
  }, { passive: false });
}

function updateViewMatrix() {
  const yawRad = g_camYaw * Math.PI / 180;
  const pitchRad = g_camPitch * Math.PI / 180;

  const x = g_camRadius * Math.cos(pitchRad) * Math.cos(yawRad);
  const y = g_camRadius * Math.sin(pitchRad);
  const z = g_camRadius * Math.cos(pitchRad) * Math.sin(yawRad);

  g_viewMatrix.setLookAt(
    x, y, z,   // eye
    0, 1.0, 0, // target: center of lion
    0, 1, 0    // up
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_viewMatrix.elements);
}

// ===== Shader helpers =====
function initShaders(gl, vshader, fshader) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) return false;

  const program = gl.createProgram();
  if (!program) return false;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const error = gl.getProgramInfoLog(program);
    console.error('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return false;
  }

  gl.useProgram(program);
  gl.program = program;
  return true;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Unable to create shader');
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    const error = gl.getShaderInfoLog(shader);
    console.error('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
