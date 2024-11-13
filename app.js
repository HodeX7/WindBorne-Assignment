const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("WebGL not supported");
  throw new Error("WebGL not supported");
}

const vsSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
`;

const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders:",
      gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program:",
      gl.getProgramInfoLog(program)
    );
    return null;
  }
  return program;
}

const program = createProgram(gl, vsSource, fsSource);
const positionLocation = gl.getAttribLocation(program, "a_position");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const colorLocation = gl.getUniformLocation(program, "u_color");
const positionBuffer = gl.createBuffer();

let segments = [
  { startPoint: [100, 100], endPoint: [200, 150], width: 2 },
  { startPoint: [200, 150], endPoint: [250, 300], width: 2 },
];

function drawScene() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform4f(colorLocation, 0.0, 0.0, 0.0, 1.0);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  segments.forEach((segment) => {
    drawThickLine(segment.startPoint, segment.endPoint, segment.width);
  });
}

function drawThickLine(p1, p2, width) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = ((-dy / len) * width) / 2;
  const ny = ((dx / len) * width) / 2;

  const vertices = [
    p1[0] + nx,
    p1[1] + ny,
    p2[0] + nx,
    p2[1] + ny,
    p2[0] - nx,
    p2[1] - ny,
    p1[0] - nx,
    p1[1] - ny,
  ];

  const bufferData = new Float32Array(vertices);
  gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

function getLineWidth() {
  return parseFloat(document.getElementById("lineWidth").value) || 1;
}

function addSegment(x, y) {
  let lastSegmentEndPoint = segments[segments.length - 1].endPoint;
  segments.push({
    startPoint: lastSegmentEndPoint,
    endPoint: [x, y],
    width: getLineWidth(),
  });
  drawScene();
}

document.getElementById("addRandomSegment").addEventListener("click", () => {
  let randomX = Math.random() * canvas.width;
  let randomY = Math.random() * canvas.height;
  addSegment(randomX, randomY);
});

document.getElementById("addCustomSegment").addEventListener("click", () => {
  const coordinatesInput = document.getElementById("coordinates").value;
  const [x, y] = coordinatesInput
    .split(",")
    .map((coord) => parseFloat(coord.trim()));
  if (!isNaN(x) && !isNaN(y)) {
    addSegment(x, y);
  } else {
    alert("Please enter valid x,y coordinates");
  }
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  addSegment(x, y);
});

drawScene();
