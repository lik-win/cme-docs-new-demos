import TileLayer from 'CME2D/layer/WebGLTile.js'
import WMTSTileGrid from 'CME2D/tilegrid/WMTS.js'
import { get as getProj } from 'CME2D/proj'
import { getWidth } from 'CME2D/extent'
import { DataTile } from 'CME2D/source.js'
import WebglRenderTile from './utils/webglRender/webglRenderTile.js'
const PORT_8882 = import.meta.env.VITE_APP_PORT_8882
const size = 256
const canvas = document.createElement('canvas')
canvas.width = size
canvas.height = size
const context = canvas.getContext('2d', { willReadFrequently: true })
context.strokeStyle = 'white'
context.textAlign = 'center'
context.font = '20px sans-serif'
const lineHeight = 16
const projection = getProj('EPSG:4326')
const projectionExtent = projection.getExtent()
const size1 = getWidth(projectionExtent) / 256
const resolutions = new Array(19)
const matrixIds = new Array(19)
for (let z = 0; z < 19; ++z) {
  resolutions[z] = size1 / Math.pow(2, z)
  matrixIds[z] = z
}
const GLtTileRender = new WebglRenderTile({ size: 256 })

/**
 *
 * @returns
 * @param contentDisposition
 */

function extractScale(contentDisposition) {
  // 正则表达式用于匹配 scale 的值
  const scaleMatch = contentDisposition.match(/scale="([^"]+)"/)
  return scaleMatch ? parseFloat(scaleMatch[1]) : 1
}

export function addGridLayer(map, dimensions = {}) {
  let gridLayer = map.getAllLayers().find((layer) => layer.get('layerName') === 'gridLayer')
  let gridTextLayer = map.getAllLayers().find((layer) => layer.get('layerName') === 'gridTextLayer')
  if (gridLayer) {
    updateSource(gridLayer, dimensions)
  } else {
    gridLayer = new TileLayer({
      layerName: 'gridLayer',
      preload: Infinity,
      opacity: 0.8,
      zIndex: 1,
      style: 'default',
      wrapX: false
    })
    updateSource(gridLayer, dimensions)
    map.addLayer(gridLayer)
  }
}

const updateSource = (layer, dimensions = {}) => {
  const { sdui, elementConfig } = dimensions
  const data = elementConfig
  const projection = getProj('EPSG:4326')
  const projectionExtent = projection.getExtent()
  const size1 = getWidth(projectionExtent) / 256
  const resolutions = new Array(19)
  const matrixIds = new Array(19)
  for (let z = 0; z < 19; ++z) {
    resolutions[z] = size1 / Math.pow(2, z)
    matrixIds[z] = z
  }
  const source = new DataTile({
    wrapX: false,
    projection: projection,
    // tileGrid: new WMTSTileGrid({
    //   origin: getTopLeft(projectionExtent),
    //   resolutions: resolutions,
    //   matrixIds: matrixIds,
    // }),
    loader: function (z, x, y) {
      const options = {
        TileMatrix: z,
        TileCol: x,
        TileRow: y,
        level: data.level,
        information: data.information,
        levelType: data.levelType,
        styleId: data.styleId,
        sourceType: data.sourceType,
        sdui: sdui
      }
      let scale = 1
      let offset = 0
      let noData = -9999
      let legend = data?.legendData?.legend
      let isUV = false
      let showZero = false
      let url1 = `${PORT_8882}/v8/render_sdui/getTile4?layer=variable&style=default&tilematrixset=ms_14&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileCol=${
        options.TileCol
      }&TileMatrix=${options.TileMatrix}&TileRow=${options.TileRow}&styleld=TMP3.json&information=${
        options.information
      }&levelType=${options.levelType}&level=${options.level}&sdui=${encodeURIComponent(
        options.sdui
      )}&sourceType=${options.sourceType}&returnData=data`
      return fetch(url1)
        .then((res) => {
          const contentDisposition = res.headers.get('Content-Disposition')
          scale = extractScale(contentDisposition)
          offset = data.id == 'TMP' ? -273.15 : 0
          isUV = data?.id === 'WIN10'
          showZero = data?.id === 'APCP'
          return res.arrayBuffer()
        })
        .then(async (data) => {
          // 输出转换后的 float32 值
          const pixelDistance = 64 // 你可以将这个值设置为10或20，或者从外部传入
          const halfDistance = pixelDistance / 2
          const halfSize = size / 2
          const half = size / 2
          context.clearRect(0, 0, size, size)
          context.fillStyle = 'rgba(100, 100, 100, 0.0)'
          context.fillRect(0, 0, size, size)
          context.fillStyle = 'black'
          context.strokeStyle = 'white' // 描边颜色为白色
          const int32data = new Int32Array(data)
          let float32Array = new Float32Array(int32data.buffer)
          if (isUV) {
            const SpeedArray = float32Array.slice(0, float32Array.length / 2)
            const DirArray = float32Array.slice(float32Array.length / 2, float32Array.length)
            const config = {
              showType: 'windBarb',
              dirData: DirArray,
              imageData: SpeedArray,
              size,
              offset,
              legend: legend,
              noData,
              scale,
              showZero
            }
            let res = await GLtTileRender._render(config)
            return res || []
          } else {
            context.font = '20px sans-serif'
            const config = {
              imageData: float32Array,
              size,
              offset,
              legend: legend,
              noData,
              scale,
              showZero
            }
            let res = await GLtTileRender._render(config)
            return res || []
          }
        })
    },
    transition: 0
  })
  layer.setSource(source)
}

const getData = (worker) => {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const result = event.data
      resolve(result.data)
    }
  })
}

function getColorRGBA(value, colorStops) {
  // 如果值小于最小阈值，返回最小阈值的颜色
  if (value <= colorStops[0][0]) {
    return colorStops[0][1].slice(0, -1).concat([0])
  }

  // 如果值大于最大阈值，返回最大阈值的颜色
  if (value >= colorStops[colorStops.length - 1][0]) {
    return colorStops[colorStops.length - 1][1].slice(0, -1).concat([255])
  }

  // 遍历颜色阈值，找到值所在的区间
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (value >= colorStops[i][0] && value < colorStops[i + 1][0]) {
      // 计算比例
      const ratio = (value - colorStops[i][0]) / (colorStops[i + 1][0] - colorStops[i][0])
      // 线性插值计算颜色
      const color = colorStops[i][1].slice(0, -1).map((c, index) => {
        return Math.round(c + (colorStops[i + 1][1][index] - c) * ratio)
      })
      // 线性插值计算透明度
      const alpha =
        Math.round(colorStops[i][1][3] * (1 - ratio) + colorStops[i + 1][1][3] * ratio) * 255
      return color.concat([alpha])
    }
  }
  // 如果没有找到合适的颜色，返回透明
  return [0, 0, 0, 0]
}

function getTopLeft(extent) {
  return [extent[0], extent[3]]
}
