let fillFrag = `precision highp float;
varying vec2 vLatLngCoords;
uniform sampler2D uTexture;
uniform sampler2D uColorRamp;
uniform sampler2D tTexture;
uniform float ramp_min;
uniform float scala;
uniform bool showText;
uniform float noData;
uniform float ramp_max;
const float PI = 3.14159265359;
const vec2 worldCoordxMin = vec2(-180.0,-90.0);
const vec2 worldCoordxMax = vec2(180.0,90.0);
vec2 mercatorToWGS84(vec2 xy) {
    // convert lat into an angle
    float y = radians(180.0 - xy.y * 360.0);
    // use the formula to convert mercator -> WGS84
    y = 360.0 / PI  * atan(exp(y)) - 90.0;
    // normalize back into 0..1 interval
    y = y / -180.0 + 0.5;
    // pass lng through, as it doesn't change
    return vec2(mod(xy.x , 1.0), y);
}

void main(void) {
    vec2 pos = fract(vLatLngCoords);
    vec4 texelColour = texture2D(uTexture,vec2(pos.x,1.0 - pos.y));
    float value = texelColour.r;
     // 图例时比例
    // float speed_t = smoothstep(ramp_min,ramp_max,value);
    float speed_t = clamp((value - ramp_min) / (ramp_max - ramp_min), 0.0, 1.0);
    // 根据速度占比
    vec2 ramp_pos = vec2(
        fract(16.0 * speed_t),
        floor(16.0 * speed_t) / 16.0);
    // 获取该点的颜色
    vec4 lengedColor =  texture2D(uColorRamp, ramp_pos);
    vec4 textureColor = texture2D(tTexture, vec2(pos.x,1.0 - pos.y));
        gl_FragColor = mix(lengedColor,textureColor,textureColor.a);
        // gl_FragColor = lengedColor;
        gl_FragColor.a = 1.0;
        if(value == -9999.0) gl_FragColor = vec4(0.0,0.0,0.0,0.0);
        if(value == 0.0 && showText) gl_FragColor = vec4(0.0,0.0,0.0,0.0);
}`;

export default fillFrag;
