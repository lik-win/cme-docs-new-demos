
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}

export function createProgram(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    const wrapper = {program: program};

    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < numAttributes; i++) {
        const attribute = gl.getActiveAttrib(program, i);

        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < numUniforms; i++) {

        const uniform = gl.getActiveUniform(program, i);

        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    return wrapper;
}

export function createTexture(gl, filter, data, width, height,type) {
    const texture = gl.createTexture();
    // 扩展浮点数纹理
    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
        alert("this machine or browser does not support OES_texture_float");
    }
    var linear =  gl.getExtension("OES_texture_float_linear");
    if (!linear) {
        alert("this machine or browser does not support  OES_texture_float_linear");
    }
    // 创建浮点纹理扩展对象
    var ext = gl.getExtension('OES_texture_float');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    if(type){
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, width, height, 0, gl.ALPHA, gl.FLOAT, data);
    }
    else {
        if (data instanceof Uint8Array) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
        }
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

export function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

export function createBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

export function bindAttribute(gl, buffer, attribute, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}

export function bindFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (texture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }
}



/**
 * 通过Canvas 创建获取 webgl对象
 */
export function createGL(canvas) {
    const options = {antialiasing: true, alpha: true,preserveDrawingBuffer:true}
    const gl =
        canvas.getContext('webgl2', options);

    if (gl) {
        // WebGL 2 has better support for extensions and functionalities.
        let _anisoExt =
            gl.getExtension('EXT_texture_filter_anisotropic') ||
            gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
            gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

        if (!_anisoExt) {
            console.warn('Your browser doesn`t support anisotropic filtering. Ordinary MIP mapping will be used.');
        }

        //this._glResources = this._setupGlContext(gl);
    } else {
        console.warn('Your browser doesn`t seem to support WebGL 2.');
    }
    return gl;
}
