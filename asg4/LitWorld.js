// HelloCube.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  uniform vec3 u_LightPosition;
  uniform vec3 u_CameraPosition;

  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  attribute vec2 a_UV;

  varying vec2 v_UV;
  varying vec4 v_Normal;
  varying vec3 v_LightDirection;
  varying vec3 v_EyeDirection;
  void main() {
    v_UV = a_UV;
    v_Normal = u_NormalMatrix * a_Normal;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;

    vec4 color = vec4(1.0, 1.0, 1.0, 1.0);

    vec4 vertexPosition = u_ModelMatrix * a_Position;

    v_LightDirection = normalize(u_LightPosition - vec3(vertexPosition));

    v_EyeDirection = normalize(u_CameraPosition - vec3(vertexPosition));
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  
  uniform sampler2D u_Texture0;
  uniform sampler2D u_Texture1;
  uniform sampler2D u_Texture2;

  uniform int u_SelectedTexture;
  uniform int u_Lit;
  uniform int u_Spotlit;

  uniform vec4 u_FragColor;

  uniform float u_ColorWeight;

  varying vec2 v_UV;
  varying vec4 v_Normal;
  varying vec3 v_LightDirection;
  varying vec3 v_EyeDirection;

  uniform vec3 u_LightColor;
  uniform vec3 u_AmbientLight;

  void main() {
  if (u_SelectedTexture == 0) {
    gl_FragColor = (u_FragColor * u_ColorWeight) + ((1.0 - u_ColorWeight) * texture2D(u_Texture0, v_UV));
  } else if (u_SelectedTexture == 1) {
    gl_FragColor = (u_FragColor * u_ColorWeight) + ((1.0 - u_ColorWeight) * texture2D(u_Texture1, v_UV));
  } else if (u_SelectedTexture == 2) {
    gl_FragColor = (u_FragColor * u_ColorWeight) + ((1.0 - u_ColorWeight) * texture2D(u_Texture2, v_UV));
  } else if (u_SelectedTexture == -1) {
    gl_FragColor = vec4((v_Normal.xyz+1.0)/2.0, 1.0);
  } else {
    gl_FragColor = u_FragColor;
  }

  if (u_Lit == 1) {
    float nDotL = max(dot(v_LightDirection, v_Normal.xyz), 0.0);

    vec3 diffuse = u_LightColor * gl_FragColor.rgb * nDotL;

    vec3 ambient = u_AmbientLight * gl_FragColor.rgb;

    vec3 reflection = reflect(-v_LightDirection, v_Normal.xyz);

    float specular = pow(max(dot(v_EyeDirection, reflection), 0.0), 10.0);

    vec4 litColor = vec4(diffuse + ambient + specular, gl_FragColor.a);

    vec4 spotlightShadowColor = vec4(ambient, gl_FragColor.a);

    if (u_Spotlit == 1) {
      if (dot(v_LightDirection, vec3(0.0, 1.0, 0.0)) > 0.5) {
        gl_FragColor = litColor;
      } else {
        gl_FragColor = spotlightShadowColor;
      }
    } else {
      gl_FragColor = litColor;
    }
    
  }
  
  }`;

// Global Vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_CameraPosition;

let a_Normal;
let u_NormalMatrix;
let u_AmbientLight;
let u_Lit;
let u_Spotlit;
let u_LightColor;
let u_LightPosition;

let a_UV;
let u_Texture0;
let u_Texture1;
let u_Texture2;
let u_SelectedTexture;

let u_ColorWeight;

let skyCube;

let lightbulb;
let litSphere;
let litSphereDEBUG;


let groundCube;
let groundCube2;
let groundCube3;
let groundCube4;
let wallCubes = [];
let meteorCubes = [];
let meteorExplosionCubes = [];
let camera;

let maxWallHeight = 5;

// INIT FUNCTIONS //
function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  window.addEventListener("resize", (e) => {
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  });

  gl.enable(gl.DEPTH_TEST);
}

// HTML FUNCTIONS //

// UI Globals
let g_normalOn = false;
let g_lightRotation = 1.55;
let g_lightAnimateOn = true;
let g_lightColorX = 1.0;
let g_lightColorY = 0.9;
let g_lightColorZ = 0.9;

// Set up actions for HTML UI elements
function addActionsForHtmlUI() {
  document.getElementById('normOn').onclick = function () { g_normalOn = true; };
  document.getElementById('normOff').onclick = function () { g_normalOn = false; };

  document.getElementById('lightOn').onclick = function () { gl.uniform1i(u_Lit, 1); };
  document.getElementById('lightOff').onclick = function () { gl.uniform1i(u_Lit, 0); };

  document.getElementById('spotlightOn').onclick = function () { gl.uniform1i(u_Spotlit, 1); };
  document.getElementById('spotlightOff').onclick = function () { gl.uniform1i(u_Spotlit, 0); };

  document.getElementById('animOn').onclick = function () { g_lightAnimateOn = true; };
  document.getElementById('animOff').onclick = function () { g_lightAnimateOn = false; };

  document.getElementById('LightRotation').addEventListener("mousemove", function () { g_lightRotation = this.value; });

  document.getElementById('LightR').addEventListener("mousemove", function () { g_lightColorX = this.value; });
  document.getElementById('LightG').addEventListener("mousemove", function () { g_lightColorY = this.value; });
  document.getElementById('LightB').addEventListener("mousemove", function () { g_lightColorZ = this.value; });
}

function main() {
  // Set up canvas and gl vars
  setupWebGL();

  // Set up GLSL shader program and connect vars
  connectVariablesToGLSL();

  // Add HTML UI Actions
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onclick = click;
  document.onkeydown = keydown;
  canvas.onmousemove = function (ev) { if (ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  camera = new Camera();

  createWorldObjects();

  requestAnimationFrame(tick);
}

let g_startTime = performance.now() / 1000.0;
let g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  // Save time
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (g_lightAnimateOn) {
    lightbulb.position.elements = [Math.cos(g_seconds) * 5 + 5.0, 8.0, Math.sin(g_seconds) * 5 + 7.0];
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, Math.cos(g_seconds) * 5 + 5.0, 8.0, Math.sin(g_seconds) * 5 + 7.0);
  } else {
    lightbulb.position.elements = [Math.cos(g_lightRotation) * 5 + 5.0, 8.0, Math.sin(g_lightRotation) * 5 + 7.0];
    // Set the light direction (in the world coordinate)
    gl.uniform3f(u_LightPosition, Math.cos(g_lightRotation) * 5 + 5.0, 8.0, Math.sin(g_lightRotation) * 5 + 7.0);
  }


  renderScene();

  requestAnimationFrame(tick);
}

function updatePerformanceIndicator(frameStartTime) {
  let perfText = document.getElementById('performanceText');
  perfText.innerHTML = "MS: " + Math.floor((performance.now() - frameStartTime) * 10) / 10 + " | FPS: " + Math.floor(10000 / (performance.now() - frameStartTime) / 10);
}

function click(ev) {

}

function keydown(ev) {
  switch (ev.keyCode) {
    case 87: camera.moveForward(); break;
    case 65: camera.moveLeft(); break;
    case 68: camera.moveRight(); break;
    case 83: camera.moveBackwards(); break;
    case 81: camera.panHorizontal(.1); break;
    case 69: camera.panHorizontal(-.1); break;
  }
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return ([x, y]);
}

function createWorldObjects() {
  // Set Texture Images
  var sunspotsImagePath = './Sunspots.png';
  var skyImagePath = './Sky.png';
  var debugImagePath = './Debug.png';
  Cube.setTexture0(gl, sunspotsImagePath);
  Cube.setTexture1(gl, skyImagePath);
  Cube.setTexture2(gl, debugImagePath);

  // SKY //
  skyCube = new Cube();
  skyCube.color = [0.1, 0.1, 0.1, 1.0];
  skyCube.solidColorWeight = 0.5;
  skyCube.scale.mul(999);

  // Map
  // In its own file Map.js

  // WALLS //

  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      let wallHeight = map[i][j];
      while (wallHeight > 0) {
        let wall = new Cube();
        wall.position = new Vector3([i, wallHeight - 1, j]);
        wall.color = [0.35, 0.25, 0.15, 1.0];
        let centerness = (Math.abs(15.5 - i) / 15.5 + Math.abs(15.5 - j) / 15.5) / 2
        wall.solidColorWeight = centerness * 0.9 + Math.random() * 0.1;
        wallCubes.push(wall);
        // console.log("wall at ", i, " , ", wallHeight - 1, " , ", j);
        wallHeight--;
      }
    }
  }

  // Light
  // Set the light color (white)
  gl.uniform3f(u_LightColor, g_lightColorX, g_lightColorY, g_lightColorZ);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);

  // Set the scene to lit by a point light
  gl.uniform1i(u_Lit, 1);
  gl.uniform1i(u_Spotlit, 0);

  // Lightbulb sphere
  lightbulb = new Cube();
  lightbulb.position = new Vector3([5.0, 8.0, 7.0]);
  lightbulb.color = [0.9, 0.9, 0.9, 1.0];
  lightbulb.scale.elements = [0.25, 0.25, 0.25];
  lightbulb.solidColorWeight = 1.0;

  // Light-testing sphere
  litSphere = new Sphere();
  litSphere.position = new Vector3([8, 6, 8]);
  litSphere.color = [0.15, 0.45, 0.35, 1.0];
  litSphere.solidColorWeight = 0.0;

  // Light-testing sphere DEBUG
  litSphereDEBUG = new Sphere();
  litSphereDEBUG.position = new Vector3([8, 8, 8]);
  litSphereDEBUG.color = [0.15, 0.45, 0.35, 1.0];
  litSphereDEBUG.solidColorWeight = 0.0;
}

function renderScene() {
  let tickStartTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.clear(gl.DEPTH_BUFFER_BIT);

  camera.update();

  // SET LIGHT COLOR BASED ON SLIDER VALS
  gl.uniform3f(u_LightColor, g_lightColorX, g_lightColorY, g_lightColorZ);

  gl.uniform3f(u_CameraPosition, camera.position.elements[0], camera.position.elements[1], camera.position.elements[2]);

  // Select sky texture in shader uniform
  gl.uniform1i(u_SelectedTexture, 1);
  skyCube.render(gl, camera);

  // Select sunspot or normal texture in shader uniform 
  if (g_normalOn) { gl.uniform1i(u_SelectedTexture, -1); } else { gl.uniform1i(u_SelectedTexture, 0); }

  // Cubes
  for (let i = 0; i < wallCubes.length; i++) {
    wallCubes[i].render(gl, camera);
  }

  lightbulb.render(gl, camera);

  // Select flat color or normal texture in shader uniform 
  if (g_normalOn) { gl.uniform1i(u_SelectedTexture, -1); } else { gl.uniform1i(u_SelectedTexture, -999); }
  litSphere.render(gl, camera);

  litSphereDEBUG.render(gl, camera);


  updatePerformanceIndicator(tickStartTime)
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ColorWeight
  u_ColorWeight = gl.getUniformLocation(gl.program, 'u_ColorWeight');
  if (!u_ColorWeight) {
    console.log('Failed to get the storage location of u_ColorWeight');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  // Get the storage location of u_Lit
  u_Lit = gl.getUniformLocation(gl.program, 'u_Lit');
  if (!u_Lit) {
    console.log('Failed to get the storage location of u_Lit');
    return;
  }

  // Get the storage location of u_Spotlit
  u_Spotlit = gl.getUniformLocation(gl.program, 'u_Spotlit');
  if (!u_Spotlit) {
    console.log('Failed to get the storage location of u_Spotlit');
    return;
  }

  // Get the storage location of u_LightColor
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  if (!u_LightColor) {
    console.log('Failed to get the storage location of u_LightColor');
    return;
  }

  // Get the storage location of u_LightPosition
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  if (!u_LightPosition) {
    console.log('Failed to get the storage location of u_LightPosition');
    return;
  }

  // Get the storage location of u_LightPosition
  u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
  if (!u_CameraPosition) {
    console.log('Failed to get the storage location of u_CameraPosition');
    return;
  }


  // Get the storage location of u_AmbientLight
  u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_AmbientLight) {
    console.log('Failed to get the storage location of u_AmbientLight');
    return;
  }

  // Get the storage location of u_Texture0
  u_Texture0 = gl.getUniformLocation(gl.program, 'u_Texture0');
  if (!u_Texture0) {
    console.log('Failed to get the storage location of u_Texture0');
    return;
  }

  // Get the storage location of u_Texture1
  u_Texture1 = gl.getUniformLocation(gl.program, 'u_Texture1');
  if (!u_Texture1) {
    console.log('Failed to get the storage location of u_Texture1');
    return;
  }

  // Get the storage location of u_Texture0
  u_Texture2 = gl.getUniformLocation(gl.program, 'u_Texture2');
  if (!u_Texture2) {
    console.log('Failed to get the storage location of u_Texture2');
    return;
  }

  // Get the storage location of u_SelectedTexture
  u_SelectedTexture = gl.getUniformLocation(gl.program, 'u_SelectedTexture');
  if (!u_SelectedTexture) {
    console.log('Failed to get the storage location of u_SelectedTexture');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (!a_UV) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (!a_Normal) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }
}