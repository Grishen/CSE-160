// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

}

function connectVariablestoGLSL(){
    // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
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

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if(!u_Size){
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = 'point';

function addActionsForHtmlUI(){
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0,.0,0.0,1.0];};
  
  document.getElementById('clearButton').onclick = function(){g_shapesList = []; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType = 'point';};
  document.getElementById('triButton').onclick = function() {g_selectedType = 'triangle';};
  document.getElementById('circleButton').onclick = function() {g_selectedType = 'circle';};

  document.getElementById('redSlide').addEventListener('input', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('input', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('input', function() {g_selectedColor[2] = this.value/100;});

  document.getElementById('sizeSlide').addEventListener('input', function() {g_selectedSize = this.value;});

  document.getElementById('segmentSlide').addEventListener('input', function() {g_selectedSegments = this.value;});

  document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0];};
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0];};

  document.getElementById('drawPicture').onclick = function() {drawMyPicture();};
}

function main() {

  setupWebGL();
  
  connectVariablestoGLSL();

  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function(ev){
    if(ev.buttons == 1){
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];
//var g_points = [];  // The array for the position of a mouse press
//var g_colors = [];  // The array to store the color of a point
//var g_sizes = [];

function click(ev) {
  [x,y] = convertCoordinatesEventToGL(ev);

  let shape;
  if(g_selectedType == 'point'){
    shape = new Point();
  }else if (g_selectedType == 'triangle'){
    shape = new Triangle();
  }else {
    shape = new Circle();
  }

  shape.position = [x,y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;
  g_shapesList.push(shape);

  // Store the coordinates to g_points array
  /*g_points.push([x, y]);

  // Store the coordinates to g_points array
  g_colors.push(g_selectedColor.slice());

  g_sizes.push(g_selectedSize);
*/

//  if (x >= 0.0 && y >= 0.0) {      // First quadrant
//    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
//  } else if (x < 0.0 && y < 0.0) { // Third quadrant
//    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
//  } else {                         // Others
//    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
//  }

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

function drawMyPicture() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // --- SKY (4 Triangles) ---
  // Background gradient-ish sky
  gl.uniform4f(u_FragColor, 0.2, 0.1, 0.4, 1.0); // Dark Purple
  drawTriangle([-1, 1, 1, 1, -1, -1]);
  drawTriangle([1, 1, 1, -1, -1, -1]);
  // Sunset Glow
  gl.uniform4f(u_FragColor, 0.6, 0.2, 0.4, 1.0); // Magenta
  drawTriangle([-1, 0, 1, 0, 0, 0.5]);
  drawTriangle([-1, -0.2, 1, -0.2, 0, 0.3]);

  // --- THE SUN (4 Triangles) ---
  gl.uniform4f(u_FragColor, 1.0, 0.8, 0.0, 1.0); // Yellow/Gold
  // Approximating a circle/diamond sun
  drawTriangle([0, 0.2, -0.2, 0, 0.2, 0]); 
  drawTriangle([0, -0.2, -0.2, 0, 0.2, 0]);
  drawTriangle([0, 0.2, -0.1, 0.3, 0.1, 0.3]);
  drawTriangle([0, -0.2, -0.1, -0.3, 0.1, -0.3]);

  // --- FAR MOUNTAINS (3 Triangles) ---
  gl.uniform4f(u_FragColor, 0.3, 0.3, 0.5, 1.0); // Muted Blue/Grey
  drawTriangle([-1.0, -0.2, -0.4, -0.2, -0.7, 0.3]);
  drawTriangle([-0.2, -0.2, 0.6, -0.2, 0.2, 0.4]);
  drawTriangle([0.4, -0.2, 1.0, -0.2, 0.7, 0.2]);

  // --- NEAR MOUNTAINS (4 Triangles) ---
  gl.uniform4f(u_FragColor, 0.1, 0.1, 0.2, 1.0); // Darker Silhouette
  drawTriangle([-0.8, -0.5, 0.0, -0.5, -0.4, 0.2]);
  drawTriangle([-0.2, -0.5, 0.8, -0.5, 0.3, 0.1]);
  drawTriangle([0.4, -0.5, 1.2, -0.5, 0.8, 0.3]);
  drawTriangle([-1.2, -0.5, -0.4, -0.5, -0.8, 0.0]);

  // --- FOREGROUND / GROUND (5 Triangles) ---
  gl.uniform4f(u_FragColor, 0.05, 0.2, 0.05, 1.0); // Dark Green
  drawTriangle([-1, -1, 1, -1, -1, -0.5]);
  drawTriangle([1, -1, -1, -0.5, 1, -0.5]);
  // Small bushes/rocks
  gl.uniform4f(u_FragColor, 0.0, 0.1, 0.0, 1.0); 
  drawTriangle([-0.6, -0.6, -0.4, -0.6, -0.5, -0.4]);
  drawTriangle([0.1, -0.7, 0.3, -0.7, 0.2, -0.5]);
  drawTriangle([0.6, -0.6, 0.8, -0.6, 0.7, -0.4]);
}