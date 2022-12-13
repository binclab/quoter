function initWebGL() {
    const coordinates = webgl.getAttribLocation(getShader(), 'coordinates');
    webgl.bindBuffer(webgl.ARRAY_BUFFER, webgl.createBuffer());
    webgl.bufferData(
        webgl.ARRAY_BUFFER,
        new Float32Array([0.8, 0.0, 0.0, 1, 1, 0.8]),
        webgl.STATIC_DRAW
    );
    webgl.clearColor(0, 0.5, 0.5, 0.9);
    webgl.clear(webgl.COLOR_BUFFER_BIT);
    webgl.vertexAttribPointer(coordinates, 2, webgl.FLOAT, false, 0, 0);
    webgl.enableVertexAttribArray(coordinates);
}

function getShader(coordinates = '0.0,1.0', color = '0.0,0.0,1.0,1.0') {
    const vertexShader = webgl.createShader(webgl.VERTEX_SHADER);
    const fragmentShader = webgl.createShader(webgl.FRAGMENT_SHADER);
    const shaderProgram = webgl.createProgram();
    webgl.shaderSource(vertexShader, 'attribute vec2 coordinates;' +
        'void main(void){gl_Position=vec4(coordinates, ' + coordinates + ');}'
    );
    webgl.shaderSource(fragmentShader,
        'void main(void){gl_FragColor=vec4(' + color + ');}'
    );
    webgl.compileShader(vertexShader);
    webgl.compileShader(fragmentShader);
    webgl.attachShader(shaderProgram, vertexShader);
    webgl.attachShader(shaderProgram, fragmentShader);
    webgl.linkProgram(shaderProgram);
    webgl.useProgram(shaderProgram);
    return shaderProgram;
}