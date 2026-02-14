// Hanette Le (hanle)
// asg3

// Global Variables for GLSL
var gl;
var canvas;
var a_Position;
var a_UV;
var u_FragColor;
var u_Size;
var u_ModelMatrix;
var u_ProjectionMatrix;
var u_ViewMatrix;
var u_GlobalRotateMatrix;
var u_Sampler0;
var u_Sampler1;
var u_whichTexture;
var u_Clicked;

// Camera Movement
var g_camera;

// UI
var gAnimalGlobalRotation = 0; // Camera
var g_jointAngle = 0; // Joint 1
var head_animation = 0;
var g_jointAngle2 = 0; // Joint 2
var g_Animation = false; // Joint 2

// Animation
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;


// Vertex shader program ==========================================
var VSHADER_SOURCE =`
   precision mediump float;
   attribute vec4 a_Position;
   attribute vec2 a_UV;
   varying vec2 v_UV;
   uniform mat4 u_ModelMatrix;
   uniform mat4 u_GlobalRotateMatrix;
   uniform mat4 u_ViewMatrix;
   uniform mat4 u_ProjectionMatrix;
   uniform bool u_Clicked; // Mouse is pressed
   void main() {
      if(u_Clicked){
         vec4(1,1,1,1);
      }
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
   }`

// Fragment shader program ========================================
var FSHADER_SOURCE =`
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    void main() {
      if(u_whichTexture == -2){
         gl_FragColor = u_FragColor;                  // Use color
      } else if (u_whichTexture == -1){
         gl_FragColor = vec4(v_UV, 1.0, 1.0);         // Use UV debug color
      } else if(u_whichTexture == 0){
         gl_FragColor = texture2D(u_Sampler0, v_UV);  // Use texture0
      } else if(u_whichTexture == 1){
         gl_FragColor = texture2D(u_Sampler1, v_UV);  // Use texture1
      } else {
         gl_FragColor = vec4(1,.2,.2,1);              // Error, Red
      }
    }`

// HTML ============================================================
function addActionsForHtmlUI(){
   // Color Slider Events
   document.getElementById('camera').addEventListener('mousemove', function() { gAnimalGlobalRotation = this.value; renderScene();});
   document.getElementById('joint').addEventListener('mousemove', function() { g_jointAngle = this.value; renderScene();});
   document.getElementById('joint2').addEventListener('mousemove', function() { g_jointAngle2 = this.value; renderScene();});
   document.getElementById('animate_on').onclick = function() {g_Animation = true;};
   document.getElementById('animate_off').onclick = function() {g_Animation = false;};

}

// Get Canvas and GL Context ======================================
function setupWebGL(){
   // Retrieve <canvas> element
   canvas = document.getElementById('asg3');
   if (!canvas) {
       console.log('Failed to retrieve the <canvas> element');
       return;
   }

   // Rendering context for WebGL
   gl = getWebGLContext(canvas);
   if(!gl){
       console.log('Failed to get the rendering context for WebGL');
       return;
   }

   gl.enable(gl.DEPTH_TEST);
}

// Compile Shader Programs and connect js to GLSL =================
function connectVariablesToGLSL(){
   // Initialize shaders ==========================================
   if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
       console.log('Failed to intialize shaders.');
       return;
   }

   // Get the storage location of attribute variable ==============
   a_Position = gl.getAttribLocation(gl.program, 'a_Position');
   if (a_Position < 0) {
       console.log('Failed to get the storage location of a_Position');
       return;
   }

   a_UV = gl.getAttribLocation(gl.program, 'a_UV');
   if (a_UV < 0) {
       console.log('Failed to get the storage location of a_UV');
       return;
   }

   // Get the storage location of attribute variable ==============
   u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
   if (!u_whichTexture) {
       console.log('Failed to get u_whichTexture');
       return;
   }

   u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
   if (!u_Clicked) {
       console.log('Failed to get u_Clicked');
       return;
   }

   // Get the storage location of attribute variable ==============
   u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
   if (!u_FragColor) {
       console.log('Failed to get u_FragColor');
       return;
   }

   u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
   if (!u_ModelMatrix) {
       console.log('Failed to get u_ModelMatrix');
       return;
   }

   u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
   if (!u_GlobalRotateMatrix) {
       console.log('Failed to get u_GlobalRotateMatrix');
       return;
   }

   u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
   if (!u_ViewMatrix) {
       console.log('Failed to get u_ViewMatrix');
       return;
   }

   u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
   if (!u_ProjectionMatrix) {
       console.log('Failed to get u_ProjectionMatrix');
       return;
   }

   // Get the storage location of u_Sampler0
   u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
   if (!u_Sampler0) {
     console.log('Failed to get the storage location of u_Sampler0');
     return false;
   }

   u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
   if (!u_Sampler1) {
     console.log('Failed to get the storage location of u_Sampler1');
     return false;
   }

   var identityM = new Matrix4();
   gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Texture Stuff ==================================================
function initTextures() {
   var image = new Image();  // Create the image object
   var image1 = new Image();  // Create the image object
   if (!image) {
      console.log('Failed to create the image object');
      return false;
   }
   if (!image1) {
      console.log('Failed to create the image1 object');
      return false;
   }
   // Register the event handler to be called on loading an image
   image.onload = function(){ sendTextureToTEXTURE0(image); };
   image1.onload = function(){ sendTextureToTEXTURE1(image1); };
   // Tell the browser to load an image
   image.src = 'grass1.png';
   image1.src = 'sky2.jpg';

   // Add more texture loading here // DEBUG:
   return true;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function sendTextureToTEXTURE0(image) {
   var texture = gl.createTexture();
   if(!texture){
      console.log('Failed to create the texture object');
      return false;
   }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     gl.generateMipmap(gl.TEXTURE_2D);
  } else {
     // Set the texture parameters
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);


  console.log("Finished loadTexture");
}
// ================================SKY
function sendTextureToTEXTURE1(image) {
   var texture = gl.createTexture();
   if(!texture){
      console.log('Failed to create the texture object');
      return false;
   }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     gl.generateMipmap(gl.TEXTURE_2D);
  } else {
     // Set the texture parameters
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  // Set the texture unit 1 to the sampler
  gl.uniform1i(u_Sampler1, 1);


  console.log("Finished loadTexture1");
}


// Main ===========================================================
function main() {
   setupWebGL();
   connectVariablesToGLSL();
   addActionsForHtmlUI();

   g_camera = new Camera();
   document.onkeydown = keydown;
   canvas.onmousemove = function(ev){
      mouseCam(ev);
   }
   canvas.onmousedown = function(ev){
      check(ev);
   }

   initTextures();

   // Specify the color for clearing <canvas>
   gl.clearColor(0.0, 0.0, 0.0, 1.0);

   requestAnimationFrame(tick);
} // end of main

function check(ev) {
  var picked = false;
  var x = ev.clientX, y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) { // inside canvas
     var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
     gl.uniform1i(u_Clicked, 1);  // Pass true to u_Clicked
     // Read pixel at the clicked position
     var pixels = new Uint8Array(4); // Array for storing the pixel value
     gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
     console.log(pixels[0]);
     if (pixels[0] == 255) // The mouse in on cube if R(pixels[0]) is 255
       picked = true;

     gl.uniform1i(u_Clicked, 0);  // Pass false to u_Clicked(rewrite the cube)
  }
  // Draw
  // if (!picked){
  //    console.log("create cube");
  //    var block = new Cube();
  //    block.color = [.90, .80, .40, 1.0];
  //    block.textureNum = -2;
  //    // block.matrix.translate(0,-.25,0);
  //    block.renderfast();
  // }
}

// Movement =======================================================
function convertCoordinatesEventToGL(ev){
   var x = ev.clientX; // x coordinate of a mouse pointer
   var y = ev.clientY; // y coordinate of a mouse pointer
   var rect = ev.target.getBoundingClientRect() ;

   // set coordinates based on origin
   x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
   y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

   // Print coordinate in console
   // console.log("("+x+","+y+")");

   return [x,y];
}

function mouseCam(ev){
   coord = convertCoordinatesEventToGL(ev);
   if(coord[0] < 0.5){ // left side
      g_camera.panMLeft(coord[0]*-10);
   } else{
      g_camera.panMRight(coord[0]*-10);
   }
}

function keydown(ev){
   if(ev.keyCode==39 || ev.keyCode == 68){ // Right Arrow or D
      g_camera.right();
   } else if (ev.keyCode==37 || ev.keyCode == 65){ // Left Arrow or A
      g_camera.left();
   } else if (ev.keyCode==38 || ev.keyCode == 87){ // up Arrow or W
      g_camera.forward();
   } else if (ev.keyCode==40 || ev.keyCode == 83){ // down Arrow or S
      g_camera.back();
   } else if (ev.keyCode==81){ // Q
      g_camera.panLeft();
   } else if (ev.keyCode==69){ // E
      g_camera.panRight();
   }
   renderScene();
}

// TICK ===========================================================
function tick(){
   g_seconds = performance.now()/1000.0 - g_startTime;
   updateAnimationAngles();
   renderScene();
   requestAnimationFrame(tick);
}

// renderScene ====================================================

function renderScene(){
   // Pass the projection matrix
   var projMat = g_camera.projMat;
   gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

   // Pass the view matrix
   var viewMat = g_camera.viewMat;
   gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

   // Pass the matrix to u_ModelMatrix attribute
   var globalRotMat = new Matrix4().rotate(gAnimalGlobalRotation, 0,1,0);
   gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

   // Clear <canvas>
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
   gl.clear(gl.COLOR_BUFFER_BIT);

   drawAllShapes();
}

function updateAnimationAngles(){
   if(g_Animation){
      g_jointAngle = 10*Math.sin(g_seconds);
      head_animation = 15*Math.sin(g_seconds);
   }
}
