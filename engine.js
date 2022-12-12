function getWebGL() {
    webgl = document.getElementById('canvas').getContext('webgl');

    if (webgl) {
        webgl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        webgl.clear(webgl.COLOR_BUFFER_BIT);
        var vertices = [-0.5, 0.5, -0.5, -0.5, 0.0, -0.5,];

        // Create a new buffer object
        var vertex_buffer = webgl.createBuffer();

        // Bind an empty array buffer to it
        webgl.bindBuffer(webgl.ARRAY_BUFFER, vertex_buffer);

        // Pass the vertices data to the buffer
        webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(vertices), webgl.STATIC_DRAW);

        // Unbind the buffer
        webgl.bindBuffer(webgl.ARRAY_BUFFER, null);

        /* Step3: Create and compile Shader programs */

        // Vertex shader source code
        var vertCode =
            'attribute vec2 coordinates;' +
            'void main(void) {' + ' gl_Position = vec4(coordinates,0.0, 1.0);' + '}';

        //Create a vertex shader object
        var vertShader = webgl.createShader(webgl.VERTEX_SHADER);

        //Attach vertex shader source code
        webgl.shaderSource(vertShader, vertCode);

        //Compile the vertex shader
        webgl.compileShader(vertShader);

        //Fragment shader source code
        var fragCode = 'void main(void) {' + 'gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);' + '}';

        // Create fragment shader object
        var fragShader = webgl.createShader(webgl.FRAGMENT_SHADER);

        // Attach fragment shader source code
        webgl.shaderSource(fragShader, fragCode);

        // Compile the fragment shader
        webgl.compileShader(fragShader);

        // Create a shader program object to store combined shader program
        var shaderProgram = webgl.createProgram();

        // Attach a vertex shader
        webgl.attachShader(shaderProgram, vertShader);

        // Attach a fragment shader
        webgl.attachShader(shaderProgram, fragShader);

        // Link both programs
        webgl.linkProgram(shaderProgram);

        // Use the combined shader program object
        webgl.useProgram(shaderProgram);

        /* Step 4: Associate the shader programs to buffer objects */

        //Bind vertex buffer object
        webgl.bindBuffer(webgl.ARRAY_BUFFER, vertex_buffer);

        //Get the attribute location
        var coord = webgl.getAttribLocation(shaderProgram, "coordinates");

        //point an attribute to the currently bound VBO
        webgl.vertexAttribPointer(coord, 2, webgl.FLOAT, false, 0, 0);

        //Enable the attribute
        webgl.enableVertexAttribArray(coord);

        /* Step5: Drawing the required object (triangle) */

        // Clear the canvas
        webgl.clearColor(0.5, 0.5, 0.5, 0.9);

        // Enable the depth test
        webgl.enable(webgl.DEPTH_TEST);

        // Clear the color buffer bit
        webgl.clear(webgl.COLOR_BUFFER_BIT);

        // Set the view port
        webgl.viewport(0, 0, canvas.width, canvas.height);

        // Draw the triangle
        webgl.drawArrays(webgl.TRIANGLES, 0, 3);

    }
    return webgl !== null;
}