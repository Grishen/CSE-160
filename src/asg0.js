// HelloTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');
  if(!canvas){
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0,0,400,400);

  var v1 = new Vector3([2.25,2.25,0]);

  drawVector(v1,"red",ctx);
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

function drawVector(v,color,ctx){
  ctx.strokeStyle = color;

  var centerX = 200;
  var centerY = 200;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);

  var endX = centerX + v.elements[0] * 20;
  var endY = centerY - v.elements[1] * 20;

  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function handleDrawEvent(){
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,400,400);

  var x = document.getElementById('v1X').value;
  var y = document.getElementById('v1Y').value;

  var v1 = new Vector3([parseFloat(x), parseFloat(y), 0]);

  drawVector(v1,"red",ctx);

  var v2X = document.getElementById('v2X').value;
  var v2Y = document.getElementById('v2Y').value;

  var v2 = new Vector3([parseFloat(v2X), parseFloat(v2Y), 0]);

  drawVector(v2, "blue", ctx);
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var v1 = new Vector3([parseFloat(document.getElementById('v1X').value), parseFloat(document.getElementById('v1Y').value), 0]);
  var v2 = new Vector3([parseFloat(document.getElementById('v2X').value), parseFloat(document.getElementById('v2Y').value), 0]);
  var v1 = new Vector3([v1X, v1Y, 0]);
  var v2 = new Vector3([v2X, v2Y, 0]);

  drawVector(v1, "red", ctx);
  drawVector(v2, "blue", ctx);

  var op = document.getElementById('operation').value;
  var s = parseFloat(document.getElementById('scalar').value);

  if (op == "angle"){
    var angle = angleBetween(v1, v2);
    console.log("Angle: " + angle.toFixed(2));
  } else if (op === "add") {
    var v3 = new Vector3(v1.elements); 
    v3.add(v2);
    drawVector(v3, "green", ctx);
  } else if (op === "sub") {
    var v3 = new Vector3(v1.elements); 
    v3.sub(v2);
    drawVector(v3, "green", ctx);
  } else if (op === "mul") {
    var v3 = new Vector3(v1.elements);
    var v4 = new Vector3(v2.elements);
    v3.mul(s);
    v4.mul(s);
    drawVector(v3, "green", ctx);
    drawVector(v4, "green", ctx);
  } else if (op === "div") {
    var v3 = new Vector3(v1.elements);
    var v4 = new Vector3(v2.elements);
    v3.div(s);
    v4.div(s);
    drawVector(v3, "green", ctx);
    drawVector(v4, "green", ctx);
  } else if (op === "magnitude") {
    console.log("Magnitude v1: " + v1.magnitude());
    console.log("Magnitude v2: " + v2.magnitude());
  } else if (op === "normalize") {
    var v3 = new Vector3(v1.elements);
    var v4 = new Vector3(v2.elements);
    v3.normalize();
    v4.normalize();
    drawVector(v3, "green", ctx);
    drawVector(v4, "green", ctx);
  } else if (op == "area"){
    var area = areaTriangle(v1, v2);
    console.log("Area of the triangle: " + area.toFixed(2));
  }
}

function angleBetween(v1, v2) {
  var dotProd = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  
  if (mag1 === 0 || mag2 === 0) {
    console.log("Error: Magnitude is zero, cannot calculate angle.");
    return 0;
  }

  var cosAlpha = dotProd / (mag1 * mag2);
  
  cosAlpha = Math.min(Math.max(cosAlpha, -1), 1);
  
  var angleRad = Math.acos(cosAlpha);
  var angleDeg = angleRad * (180 / Math.PI);
  
  return angleDeg;
}

function areaTriangle(v1, v2){
  var v3 = Vector3.cross(v1, v2);
  var parallelogramArea = v3.magnitude();
  return parallelogramArea / 2;
}