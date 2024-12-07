import * as util from "./useFill";
import fillVert from "./fill.vert.glsl";
import fillFrag from "./fill.frag.glsl";
import {getWindBardIcon} from "../getWindIcon.js";
export default class WebglRenderTile {
  constructor(options) {
    const {  size } =
      options;
    this.options = options;
    this.initGL();
  }
  initGL() {
    const {  size } = this.options;
    this.canvas = document.createElement("canvas");
    this.textCancvas = document.createElement("canvas");
    this.canvas.width = size;
    this.canvas.height = size;
    this.textCancvas.width = size;
    this.textCancvas.height = size;
    this.textCancvasContent = this.textCancvas.getContext("2d", { willReadFrequently: true });
    this.textCancvasContent.strokeStyle = "white";
    this.textCancvasContent.textAlign = "center";
    this.textCancvasContent.font = "20px sans-serif";
    this.gl = util.createGL(this.canvas);
    this.program = util.createProgram(this.gl, fillVert, fillFrag);
    this.gl.useProgram(this.program.program);
    this.showText = true
    // 初始化相关参数配置
    // 顶点坐标范围
    this.vertexCoordsBuffer = util.createBuffer(
      this.gl,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
    );
    // 图片纹理范围坐标的默认范围，根据经纬度像表计算出来
    this.latLngCoordsBuffer = util.createBuffer(
      this.gl,
      new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]),
    );
  }

  parseRealDataCallBack(config) {
    const {offset,scale,value} = config
    return Number(value / scale + offset).toFixed(1)
  }

    _render(config) {
   return new Promise(async (resolve, reject) => {
     const {imageData, size, offset, scale, showZero, legend, noData, showType = 'value'} =
         config;
     this.showText = showZero
     let minValue = 1e6;
     let maxValue = -minValue;
     const arrayBufferViewSize = 4 * size * size;
     const arrayBufferView = new Float32Array(arrayBufferViewSize);
     for (let r = 0; r < size; r++) {
       for (let c = 0; c < size; c++) {
         const i = c + r * size;
         let u = imageData[i];
         let realU = u === noData ? u : this.parseRealDataCallBack({offset, scale, value: u})
         if (realU < minValue) minValue = u;
         if (realU > maxValue) maxValue = u;
         arrayBufferView[i * 4] = realU;
       }
     }
     this.image = {
       width: size,
       height: size,
       data: arrayBufferView,
       minValue,
       maxValue,
       scale,
       noData,
       offset
     }
     // //图例纹理
     this.colorRampTexture = this.createTexture(
         this.gl,
         this.gl.NEAREST,
         this.makeColorRamp(legend),
         16,
         16,
         false,
     );
     this.spotTexture = this.createTexture(
         this.gl,
         this.gl.NEAREST,
         this.image.data,
         size,
         size,
         true
     );
     this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
     this.gl.clearColor(0.5, 0.5, 0.5, 0);
     this.gl.enable(this.gl.BLEND);
     // 准备绘制
     util.bindAttribute(
         this.gl,
         this.vertexCoordsBuffer,
         this.program.aVertexCoords,
         2,
     );
     util.bindAttribute(
         this.gl,
         this.latLngCoordsBuffer,
         this.program.aLatLngCoords,
         2,
     );
     const textTextureData = showType === 'value' ? this._renderToCanvasText(config) : await this._renderToCanvasWindBarb(config)
     this.textTexture = this.createTexture(
         this.gl,
         this.gl.NEAREST,
         textTextureData,
         size,
         size,
         true
     );
     this.gl.uniform1f(this.program.scala, scale);
     this.gl.uniform1f(this.program.showText, this.showText);
     this.gl.uniform1f(this.program.noData, noData);
     // 绑定图片纹理
     util.bindTexture(this.gl, this.spotTexture, 0);
     util.bindTexture(this.gl, this.colorRampTexture, 1);
     util.bindTexture(this.gl, this.textTexture, 2);
     this.gl.uniform1i(this.program.uTexture, 0);
     this.gl.uniform1i(this.program.uColorRamp, 1);
     this.gl.uniform1i(this.program.tTexture, 2);
     // 开始绘制
     this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
     const pixels = new Uint8Array(size * size * 4);
     this.gl.readPixels(0, 0, size, size, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)
     resolve(pixels)
   })
  }

  _renderToCanvasText(config) {
    const {imageData, size, offset, scale, showZero, legend, noData } =
        config;
    // 输出转换后的 float32 值
    const pixelDistance = 64; // 你可以将这个值设置为10或20，或者从外部传入
    const halfDistance = pixelDistance / 2;
    const halfSize = size / 2;
    const half = size / 2;
    this.textCancvasContent.clearRect(0, 0, size, size);
    this.textCancvasContent.fillStyle = "rgba(100, 100, 100, 0.0)";
    this.textCancvasContent.fillRect(0, 0, size, size);
    this.textCancvasContent.fillStyle = "black";
    this.textCancvasContent.strokeStyle = "white"; // 描边颜色为白色
    this.textCancvasContent.font = "20px sans-serif";
    for (let i = 0; i < size; i += pixelDistance) {
        for (let j = 0; j < size; j += pixelDistance) {
            // 计算中心位置的索引
            const dataIndex = (i + halfDistance) * size + (j + halfDistance);
            const dataValue = imageData[dataIndex]!==0 && imageData[dataIndex]!== noData  ? Number(imageData[dataIndex] / scale + offset).toFixed(1):'';
            let data = Number(dataValue) === 0 && showZero ? '': Number(dataValue)
            if(data || data===0){
                // 在画布上的中心位置绘制文本
                this.textCancvasContent.strokeText(`${data}`, j + halfDistance, i + halfDistance);
                this.textCancvasContent.fillText(`${data}`, j + halfDistance, i + halfDistance);
            }
        }
    }
    return this.textCancvasContent.getImageData(0, 0, size, size).data;
  }

   async _renderToCanvasWindBarb (config) {
    const {imageData,dirData,size, offset, scale, showZero, legend, noData } =
        config;
    // 输出转换后的 float32 值
    const pixelDistance = 64;
    const halfDistance = pixelDistance / 2;
    this.textCancvasContent.clearRect(0, 0, size, size);
    this.textCancvasContent.fillStyle = "rgba(100, 100, 100, 0.0)";
    this.textCancvasContent.fillRect(0, 0, size, size);
    this.textCancvasContent.fillStyle = "black";
    this.textCancvasContent.strokeStyle = "white"; // 描边颜色为白色
    // 按照 pixelDistance 像素间隔提取数据并渲染
    for (let i = 0; i < size; i += pixelDistance) {
      for (let j = 0; j < size; j += pixelDistance) {
        // 计算中心位置的索引
        const dataIndex =
          (i + halfDistance) * size + (j + halfDistance);
        const speed =
            imageData[dataIndex] !== noData
            ? Number(imageData[dataIndex] / scale + offset).toFixed(1)
            : "";
        const dir =
            dirData[dataIndex] !== noData
            ? Number(dirData[dataIndex] / scale + offset).toFixed(1)
            : "";
        // let  speed = dataValueU!=='' ?  (getWindSpeed(dataValueU,dataValueV)).toFixed(1) :''
        if (speed !== "") {
          const u16 = getWindBardIcon(Number(speed), "barb");
          const icon = eval(
            ('("' + u16).replace("&#x", "\\u").replace(";", "") + '")',
          );
          const ICON_FONT_NAME = "iconfont"; // 字体名称按照实际使用的替换
          this.textCancvasContent.font = `${32}px ${ICON_FONT_NAME}`;
          await document.fonts.load(this.textCancvasContent.font);
          this.textCancvasContent.save();
          this.textCancvasContent.translate(j + halfDistance, i + halfDistance);
          this.textCancvasContent.rotate((dir * Math.PI) / 180);
          this.textCancvasContent.fillText(icon, 0, 0);
          // 恢复 Canvas 到初始状态
          this.textCancvasContent.restore();
        }
      }
    }
    return this.textCancvasContent.getImageData(0, 0, size, size).data;
  }

  showGridText(){

  }
  makeColorRamp(legend, type = "step") {
    let colors = legend.map(item => {
      return [item[0], `rgba(${item[1][0]},${item[1][1]},${item[1][2]},${item[1][3]})`];
    });
    const minRampVal = colors[0][0];
    const maxRampVal = colors[colors.length - 1][0];

    // WebGL 中绑定颜色纹理的最大和最小值
    this.gl.uniform1f(this.program.ramp_min, minRampVal);
    this.gl.uniform1f(this.program.ramp_max, maxRampVal);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 1;

    if (type === "linear") {
      // 插值渐变
      let gradient = ctx.createLinearGradient(0, 0, 256, 0);
      for (let stop = 0; stop < colors.length; stop++) {
        const v = (colors[stop][0] - minRampVal) / (maxRampVal - minRampVal);
        gradient.addColorStop(v, colors[stop][1]);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 1);

    } else if (type === "step") {
      for (let i = 0; i < colors.length; i += 1) {
        const key = colors[i][0];
        let keyNext = key;
        if (i < colors.length - 1) {
          keyNext = colors[i + 1][0];
        } else {
          keyNext = maxRampVal;
        }
        const color = colors[i][1];
        const current = ((key - minRampVal) / (maxRampVal - minRampVal)) * 256; // 0 - w
        const next = ((keyNext - minRampVal) / (maxRampVal - minRampVal)) * 256; // 0 - w
        ctx.fillStyle = color;
        ctx.fillRect(current, 0, next - current, 1);
      }
    } else {
      throw new Error("Invalid type. Must be 'linear' or 'step'.");
    }
    return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
  }



  createTexture(gl, filter, data, width, height,flag) {
    var linear = gl.getExtension("OES_texture_float_linear");
    if (!linear) {
      alert(
        "this machine or browser does not support  OES_texture_float_linear",
      );
    }
    // 创建浮点纹理扩展对象
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    flag ? gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) :gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); //纹理图片上下反转
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

    if (data instanceof Float32Array) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        width,
        height,
        0,
        gl.RGBA,
        gl.FLOAT,
        data,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data,
      );
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
}
