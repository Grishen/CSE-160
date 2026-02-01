// main.js

// ===== Shaders =====
const VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_NormalMatrix;

uniform vec3 u_LightDirection;
uniform vec3 u_LightColor;
uniform vec3 u_AmbientColor;
uniform vec3 u_Color;

varying vec3 v_Color;

void main() {
  mat4 modelView = u_ViewMatrix * u_ModelMatrix;
  gl_Position = u_ProjMatrix * modelView * a_Position;

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
let u_ModelMatrix, u_ViewMatrix, u_ProjMatrix, u_NormalMatrix;
let u_Color, u_LightDirection, u_LightColor, u_AmbientColor;

// Geometry buffers
let cubeBuffers = null;
let cylinderBuffers = null;

// Matrices
const g_viewMatrix = new Matrix4();
const g_projMatrix = new Matrix4();
const g_normalMatrix = new Matrix4();

// Time / animation
let g_time = 0;
let g_lastTime = performance.now();
let g_walkOn = true; // auto walk by default

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
  if (!gl) {
    alert('Failed to get WebGL context');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    alert('Failed to init shaders');
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  // locations
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_Color = gl.getUniformLocation(gl.program, 'u_Color');
  u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_AmbientColor = gl.getUniformLocation(gl.program, 'u_AmbientColor');

  // Camera & projection
  updateViewMatrix();
  g_projMatrix.setPerspective(45, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix, false, g_projMatrix.elements);

  // Light
  gl.uniform3f(u_LightDirection, 0.5, 1.0, 0.7);
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(u_AmbientColor, 0.22, 0.22, 0.22);

  // Geometry
  cubeBuffers = initCubeBuffers();
  cylinderBuffers = initCylinderBuffers();

  // Mouse + wheel
  initMouse(canvas);

  // Initial frame
  renderScene();

  // Start animation loop
  requestAnimationFrame(tick);
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

// ===== Scene =====
function renderScene() {
  gl.clearColor(0.55, 0.82, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Ground plane
  const ground = new Matrix4();
  ground.setTranslate(0, -0.5, 0);
  ground.scale(40, 0.1, 40);
  drawCube(ground, [0.32, 0.70, 0.35]);

  drawLion();
}

function drawLion() {
  const bodyColor = [0.90, 0.72, 0.30];
  const bellyColor = [0.98, 0.90, 0.65];
  const maneColor  = [0.55, 0.30, 0.10];
  const legColor   = [0.86, 0.70, 0.32];
  const pawColor   = [0.98, 0.92, 0.80];
  const noseColor  = [0.25, 0.15, 0.15];
  const earColor   = [0.45, 0.25, 0.12];
  const tailTuftColor = [0.45, 0.25, 0.12];


  // Base: slightly higher so paws are closer to ground plane top
  const base = new Matrix4();
  base.setTranslate(0, 3.5, 0); // was 1.0
  base.scale(1.1, 1.1, 1.1);

  // ===== BODY =====
  const body = new Matrix4(base);
  body.scale(3.2, 1.0, 1.2);
  drawCube(body, bodyColor);

  const chest = new Matrix4(base);
  chest.translate(0.9, 0.1, 0);
  chest.scale(1.0, 1.1, 1.1);
  drawCube(chest, bodyColor);

  const belly = new Matrix4(base);
  belly.translate(0.0, -0.45, 0.0);
  belly.scale(2.4, 0.35, 0.9);
  drawCube(belly, bellyColor);

  // ===== HEAD =====
  const headBase = new Matrix4(base);
  headBase.translate(2.1, 0.4, 0.0);

  const headYaw = Math.sin(g_time * 1.3) * (g_walkOn ? 8 : 3);
  const headPitch = Math.sin(g_time * 0.8) * (g_walkOn ? 4 : 2);
  headBase.rotate(headYaw, 0, 1, 0);
  headBase.rotate(headPitch, 0, 0, 1);

  const head = new Matrix4(headBase);
  head.scale(1.0, 0.85, 0.9);
  drawCube(head, bodyColor);

  const muzzle = new Matrix4(headBase);
  muzzle.translate(0.65, -0.15, 0.0);
  muzzle.scale(0.9, 0.55, 0.7);
  drawCube(muzzle, bellyColor);

  const nose = new Matrix4(headBase);
  nose.translate(1.05, -0.05, 0.0);
  nose.scale(0.2, 0.20, 0.35);
  drawCube(nose, noseColor);

  const brow = new Matrix4(headBase);
  brow.translate(0.6, 0.30, 0.0);
  brow.scale(0.9, 0.25, 0.9);
  drawCube(brow, bodyColor);

  const leftEarBase = new Matrix4(headBase);
  leftEarBase.translate(-0.1, 0.7, 0.35);
  leftEarBase.scale(0.30, 0.35, 0.25);
  drawCube(leftEarBase, earColor);

  const rightEarBase = new Matrix4(headBase);
  rightEarBase.translate(-0.1, 0.7, -0.35);
  rightEarBase.scale(0.30, 0.35, 0.25);
  drawCube(rightEarBase, earColor);

  // ===== MANE =====
  const maneCore = new Matrix4(headBase);
  maneCore.scale(1.45, 1.3, 1.45);
  drawCylinder(maneCore, maneColor);

  const maneFront = new Matrix4(headBase);
  maneFront.translate(0.0, -0.05, 0.0);
  maneFront.scale(1.2, 1.4, 1.25);
  drawCube(maneFront, maneColor);

  const maneLeft = new Matrix4(headBase);
  maneLeft.translate(-0.7, 0.0, 0.65);
  maneLeft.scale(0.4, 1.4, 0.7);
  drawCube(maneLeft, maneColor);

  const maneRight = new Matrix4(headBase);
  maneRight.translate(-0.7, 0.0, -0.65);
  maneRight.scale(0.4, 1.4, 0.7);
  drawCube(maneRight, maneColor);

  const maneBottom = new Matrix4(headBase);
  maneBottom.translate(-0.4, -0.8, 0.0);
  maneBottom.scale(1.0, 0.5, 1.0);
  drawCube(maneBottom, maneColor);

  // ===== WALK CYCLE ANGLES (front right & hind legs) =====
  const walkPhase = g_time * 2.5;

  // Front right leg (animated)
  const frHipAngle   = g_walkOn ? -Math.sin(walkPhase) * 25 : 0;
  const frKneeAngle  = g_walkOn ? 30 + Math.sin(walkPhase + Math.PI / 4) * 15 : 15;
  const frAnkleAngle = g_walkOn ? -5  + Math.sin(walkPhase + Math.PI / 2) * 8 : 0;

  // Hind legs (out of phase)
  const backHipSwing  = g_walkOn ? Math.sin(walkPhase + Math.PI) * 25 : 0;
  const backKneeSwing = g_walkOn ? 35 + Math.sin(walkPhase + Math.PI + Math.PI / 4) * 15 : 20;

    // Front left leg angles (out of phase with front right)
    const lfHipAngle   = g_walkOn ?  Math.sin(walkPhase + Math.PI) * 25 : 0;
    const lfKneeAngle  = g_walkOn ? 30 + Math.sin(walkPhase + Math.PI + Math.PI / 4) * 15 : 15;
    const lfAnkleAngle = g_walkOn ? -5  + Math.sin(walkPhase + Math.PI + Math.PI / 2) * 8 : 0;

  // ===== FRONT LEFT LEG (now animated) =====
    const lfHipBase = new Matrix4(base);
    lfHipBase.translate(1.0, -0.8, 0.55);
    lfHipBase.rotate(lfHipAngle, 0, 0, 1);

    const lfUpper = new Matrix4(lfHipBase);
    lfUpper.scale(0.35, 1.0, 0.35);
    lfUpper.translate(0, -1.0, 0);
    drawCube(lfUpper, legColor);

    const lfKneeBase = new Matrix4(lfHipBase);
    lfKneeBase.translate(0, -1.4, 0);
    lfKneeBase.rotate(lfKneeAngle, 0, 0, 1);

    const lfLower = new Matrix4(lfKneeBase);
    lfLower.scale(0.32, 0.7, 0.32);
    lfLower.translate(0, -0.7, 0);
    drawCube(lfLower, legColor);

    const lfAnkleBase = new Matrix4(lfKneeBase);
    lfAnkleBase.translate(0, -1.25, 0.10);
    lfAnkleBase.rotate(lfAnkleAngle, 0, 0, 1);

    const lfPaw = new Matrix4(lfAnkleBase);
    lfPaw.scale(0.45, 0.25, 0.6);
    drawCube(lfPaw, pawColor);

  // ===== FRONT RIGHT LEG (animated) =====
  const rfHipBase = new Matrix4(base);
  rfHipBase.translate(1.0, -0.8, -0.55);
  rfHipBase.rotate(frHipAngle, 0, 0, 1);

  const rfUpper = new Matrix4(rfHipBase);
  rfUpper.scale(0.35, 1.0, 0.35);
  rfUpper.translate(0, -1.0, 0);
  drawCube(rfUpper, legColor);

  const rfKneeBase = new Matrix4(rfHipBase);
  rfKneeBase.translate(0, -1.4, 0);
  rfKneeBase.rotate(frKneeAngle, 0, 0, 1);

  const rfLower = new Matrix4(rfKneeBase);
  rfLower.scale(0.32, 0.7, 0.32);
  rfLower.translate(0, -0.7, 0);
  drawCube(rfLower, legColor);

  const rfAnkleBase = new Matrix4(rfKneeBase);
  rfAnkleBase.translate(0, -1.25, 0.10);
  rfAnkleBase.rotate(frAnkleAngle, 0, 0, 1);

  const rfPaw = new Matrix4(rfAnkleBase);
  rfPaw.scale(0.45, 0.25, 0.6);
  drawCube(rfPaw, pawColor);

  // ===== HIND LEFT LEG =====
  const hlHipBase = new Matrix4(base);
  hlHipBase.translate(-1.1, -0.7, 0.6);
  hlHipBase.rotate(backHipSwing, 0, 0, 1);

  const hlUpper = new Matrix4(hlHipBase);
  hlUpper.scale(0.45, 1.1, 0.45);
  hlUpper.translate(0, -1.1, 0);
  drawCube(hlUpper, legColor);

  const hlKneeBase = new Matrix4(hlHipBase);
  hlKneeBase.translate(0, -1.55, 0);
  hlKneeBase.rotate(backKneeSwing, 0, 0, 1);

  const hlLower = new Matrix4(hlKneeBase);
  hlLower.scale(0.4, 0.8, 0.4);
  hlLower.translate(0, -0.8, 0);
  drawCube(hlLower, legColor);

  const hlPawBase = new Matrix4(hlKneeBase);
  hlPawBase.translate(0, -1.3, 0.15);
  const hlPaw = new Matrix4(hlPawBase);
  hlPaw.scale(0.50, 0.28, 0.70);
  drawCube(hlPaw, pawColor);

  // ===== HIND RIGHT LEG =====
  const hrHipBase = new Matrix4(base);
  hrHipBase.translate(-1.1, -0.7, -0.6);
  hrHipBase.rotate(-backHipSwing, 0, 0, 1);

  const hrUpper = new Matrix4(hrHipBase);
  hrUpper.scale(0.45, 1.1, 0.45);
  hrUpper.translate(0, -1.1, 0);
  drawCube(hrUpper, legColor);

  const hrKneeBase = new Matrix4(hrHipBase);
  hrKneeBase.translate(0, -1.55, 0);
  hrKneeBase.rotate(-backKneeSwing, 0, 0, 1);

  const hrLower = new Matrix4(hrKneeBase);
  hrLower.scale(0.4, 0.8, 0.4);
  hrLower.translate(0, -0.8, 0);
  drawCube(hrLower, legColor);

  const hrPawBase = new Matrix4(hrKneeBase);
  hrPawBase.translate(0, -1.3, 0.15);
  const hrPaw = new Matrix4(hrPawBase);
  hrPaw.scale(0.50, 0.28, 0.70);
  drawCube(hrPaw, pawColor);

  // ===== TAIL (unchanged from your version) =====
  const tailRoot = new Matrix4(base);
  tailRoot.translate(-1.7, 0.25, 0);

  let baseAngle = 30 + (g_walkOn ? Math.sin(g_time * 4.0) * 20 : 0);
  let midAngle  = -15 + (g_walkOn ? Math.sin(g_time * 4.0 + 0.7) * 18 : 0);
  let tipAngle  = 10  + (g_walkOn ? Math.sin(g_time * 4.0 + 1.3) * 14 : 0);

  if (g_pokeActive) {
    const elapsed = g_time - g_pokeStartTime;
    const phase = Math.min(1.0, elapsed / POKE_DURATION);
    const wiggle = Math.sin(phase * Math.PI * 6.0) * 40;
    baseAngle += wiggle;
    midAngle  -= wiggle * 0.7;
    tipAngle  += wiggle * 0.5;
  }

  const tailBaseSeg = new Matrix4(tailRoot);
  tailBaseSeg.rotate(baseAngle, 0, 0, 1);
  tailBaseSeg.translate(-0.6, 0, 0);
  tailBaseSeg.scale(1.0, 0.18, 0.18);
  drawCube(tailBaseSeg, bodyColor);

  const tailMidBase = new Matrix4(tailRoot);
  tailMidBase.rotate(baseAngle, 0, 0, 1);
  tailMidBase.translate(-1.1, 0, 0);
  tailMidBase.rotate(midAngle, 0, 0, 1);
  const tailMidSeg = new Matrix4(tailMidBase);
  tailMidSeg.translate(-0.6, 0, 0);
  tailMidSeg.scale(1.0, 0.16, 0.16);
  drawCube(tailMidSeg, bodyColor);

  const tailTipBase = new Matrix4(tailMidBase);
  tailTipBase.translate(-1.1, 0, 0);
  tailTipBase.rotate(tipAngle, 0, 0, 1);

  const tailTipSeg = new Matrix4(tailTipBase);
  tailTipSeg.translate(-0.4, 0, 0);
  tailTipSeg.scale(0.7, 0.18, 0.18);
  drawCube(tailTipSeg, bodyColor);

  const tailTuft = new Matrix4(tailTipBase);
  tailTuft.translate(-0.8, 0, 0);
  tailTuft.scale(0.6, 0.4, 0.4);
  drawCube(tailTuft, tailTuftColor);
}

// ===== Animation / tick =====
function tick(nowMs) {
  const now = nowMs || performance.now();
  const dt = (now - g_lastTime) / 1000.0;
  g_lastTime = now;

  g_time += dt;

  updateAnimation(dt);
  renderScene();

  requestAnimationFrame(tick);
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
