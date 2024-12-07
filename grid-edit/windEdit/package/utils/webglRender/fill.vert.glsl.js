let  fillVert=`attribute vec2 aVertexCoords;
attribute vec2 aLatLngCoords;
varying vec2 vLatLngCoords;
uniform float uMixValue;
void main(void) {   
    gl_Position = vec4(aVertexCoords , 1.0, 1.0);
    // vTextureCoords = aTextureCoords;
    // vCRSCoords = aCRSCoords;
    vLatLngCoords = aLatLngCoords;
}`
export default  fillVert
