<script setup>
import allEdit from '/src/demos/grid-edit/windEdit/package/allEdit.vue'
import radiusSelect from '/src/demos/grid-edit/windEdit/package/radiusSelect.vue'
import Map from 'CME2D/Map.js'
import TileLayer from 'CME2D/layer/Tile.js'
import XYZ from 'CME2D/source/XYZ.js'
import View from 'CME2D/View.js'
import VectorLayer from 'CME2D/layer/Vector.js'
import VectorSource from 'CME2D/source/Vector.js'
import { onMounted, ref } from 'vue'
import { ElLoading, ElMessage } from 'element-plus'
import axios from 'axios'
const mapRef = ref(null) //地图实例
const jd = ref(116.44)
const wd = ref(39.92)
const selectEditFeatureIndex = ref(0)
const currentEditType = ref('漫游')
const currentEditGeojsonId = ref('')
import drawTools from '@/page/demos/interactive/gridEdit/PolygonEdit/package/utils/drawTools'
const PORT_8882 = import.meta.env.VITE_APP_PORT_8882
let map, vectorLayer, iconStyle
const editRef = ref(null)
let mapUrl = import.meta.env.VITE_APP_BASE_MAP
const currentValueType = ref('v') // v 为值操作 d 为 风向修改
let url = import.meta.env.VITE_APP_SERVE_URL + 'logo2.png'
const DrawToll = ref(null) //绘制工具
vectorLayer = new VectorLayer({
  source: new VectorSource(),
})
const assignmentOptionsList = ref([{ label: '定值', value: 'fix', id: 1 }])
const editTool = ref([
  {
    label: '漫游',
    id: '漫游',
    icon: 'frehand',
    disabled: false,
    checked: true,
    type: 'view',
  },
  {
    id: '落区',
    label: '落区',
    icon: 'luoqu',
    disabled: false,
    type: 'edit',
    checked: true,
  },
])

const numdata = ref(0)
const assignmentOptions = ref('fix') //选项(加,减,定)
// 初始化地图
function initMap() {
  map = new Map({
    target: mapRef.value, //挂载实例
    layers: [
      new TileLayer({
        preload: Infinity, //开启预加载模式
        source: new XYZ({
          url: mapUrl, //url地址
        }),
      }),
      vectorLayer,
    ],
    view: new View({
      //地图视图
      center: [106, 35],
      projection: 'EPSG:4326',
      zoom: 4,
    }), //地图设置
    controls: [], //取消地图操作
  })
}

const tempConfig = {
  id: 'WIN10',
  name: '10米风',
  element: 'WIN',
  barId: 'WIN_ARROW',
  forecastTime: 0,
  levelType: '103',
  level: '10',
  step: 10,
  timeSkip: 60,
  showText: true,
  sourceType: 'BUSINESS',
  information: 'CMA_MESO_FOR_CHN',
  styleId: 'GUST.json',
  legendData: {
    barbImg: 'pic/windLine/windy.png',
    legend: [
      [0, [82, 71, 141, 1]],
      [1, [85, 78, 177, 1]],
      [2, [80, 87, 184, 1]],
      [4, [67, 105, 196, 1]],
      [6, [64, 160, 180, 1]],
      [8, [78, 193, 103, 1]],
      [10, [104, 209, 79, 1]],
      [12, [157, 221, 68, 1]],
      [16, [195, 226, 51, 1]],
      [18, [247, 122, 9, 1]],
      [20, [251, 60, 60, 1]],
      [24, [194, 3, 0, 1]],
      [30, [217, 66, 114, 1]],
      [36, [147, 23, 78, 1]],
      [42, [43, 0, 1, 1]],
    ],
  },
  layerOpacity: 0.8,
  showHide: true,
  radio: 2,
  zIndex: 100,
  nodata: -9990,
  typeColor: 'black',
  distanceArrow: 80,
}
const initDemision = {
  dt: '20241024140000',
  n: tempConfig.element,
  ybs: 1,
  ybe: 1,
  step: tempConfig.step,
}

onMounted(() => {
  // 初始化地图
  initMap()
  addTempGrid()
})

const addTempGrid = () => {
  editRef.value.initGridLayer(map, initDemision, tempConfig)
}

const ev_apply = () => {
  const editDemision = {
    dt: '20241024140000',
    n: tempConfig.element,
    ybs: 1,
    ybe: 1,
    step: tempConfig.step,
    all: true,
    ret: 'SUM',
    ops: [
      {
        t: assignmentOptions.value,
        r: currentEditGeojsonId.value || '',
        v: numdata.value,
        w: currentValueType.value === 'v' ? 's' : 'd',
        type: 'polygon',
      },
    ],
  }
  editRef.value.editGridLayer(map, editDemision, tempConfig)
}

const ev_select = async (item, index) => {
  if (item.id === '漫游') {
    let element = map.values_?.target
    element.style.cursor = 'default'
    DrawToll.value && DrawToll.value.clearInteraction() // 清除绘制工具
    selectEditFeatureIndex.value = index
  }
  if (item?.type === 'edit') {
    let element = map.values_?.target
    element.style.cursor = 'crosshair'
    if (selectEditFeatureIndex.value !== 0) {
      // 视图模式不用清空图元
      DrawToll.value && DrawToll.value.clear() //
    }
    //编辑模式
    currentEditType.value = item.id
    if (currentEditType.value === '落区') {
      if (!DrawToll.value) {
        DrawToll.value = new drawTools(map)
      }
      ev_draw()
    }
    selectEditFeatureIndex.value = index
  }
}

// 绘制
const ev_draw = () => {
  DrawToll.value && DrawToll.value.clear() //
  DrawToll.value.drawInteraction('PolygonSmooth', true)
  DrawToll.value.drawStart(() => {
    console.log('start')
  })
  DrawToll.value.drawEnd((feature) => {
    let smoothedCoordinates = feature.getGeometry().getCoordinates()
    let timestamp = new Date().getTime()
    const geojsonPolygon = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [smoothedCoordinates],
      },
      properties: {
        name: 'My Polygon',
      },
    }
    const loading = ElLoading.service({
      lock: true,
      text: '数据校验中',
      background: 'rgba(0, 0, 0, 0.7)',
    })
    axios
      .post(`${PORT_8882}/v8/saveGoJsonData`, {
        dataId: timestamp,
        data: JSON.stringify(geojsonPolygon),
      })
      .then((res) => {
        let msg = res?.data?.msg
        let code = res?.data?.code
        if (code === 201) {
          ElMessage.info(msg)
          DrawToll.value.vectorSource.clear()
          loading.close()
        } else {
          currentEditGeojsonId.value = timestamp
          loading.close()
        }
      })
      .catch((err) => {
        loading.close()
      })
  })
}

const ev_reset = () => {
  addTempGrid()
  DrawToll.value && DrawToll.value.clear()
  DrawToll.value && DrawToll.value.clearFeature()
}

const ev_changeEditType = () => {
  currentValueType.value === 'v'
    ? (currentValueType.value = 'd')
    : (currentValueType.value = 'v')
  numdata.value = 0
  if (currentValueType.value === 'd') {
    //
  }
}

const ev_selectAngle = (angle) => {
  numdata.value = angle
}
</script>
<template>
  <div ref="mapRef" class="map"></div>
  <div class="edit_panel">
    <div class="row">
      <el-button v-for="(item, i) in editTool" @click="ev_select(item, i)">{{
        item.label
      }}</el-button>
    </div>
    <div class="row">
      <el-button
        :type="item.value === assignmentOptions ? 'primary' : 'default'"
        v-for="item in assignmentOptionsList"
        :key="item.id"
        @click="assignmentOptions = item.value"
        >{{ item.label }}</el-button
      >
    </div>
    <el-button style="width: 100px" @click="ev_changeEditType">{{
      `${currentValueType === 'v' ? '风速' : '风向'}编辑`
    }}</el-button>
    <el-input-number
      v-if="currentValueType === 'v'"
      v-model="numdata"
      style="width: 200px"
    ></el-input-number>
    <radiusSelect
      v-if="currentValueType === 'd'"
      @angle="ev_selectAngle"
    ></radiusSelect>
    <div class="row">
      <el-button @click="ev_apply" style="width: 100px">应用</el-button>
      <el-button @click="ev_reset" style="width: 100px">重置</el-button>
    </div>
  </div>
  <allEdit ref="editRef"></allEdit>
</template>
<style lang="scss">
.edit_panel {
  width: 100%;
  gap: 5px;
  display: flex;
  flex-direction: column;
  .row {
    display: flex;
    flex-direction: row;
  }
}
.map {
  width: 100%;
  height: 500px;
  position: relative;

  .wrapper {
    position: absolute;
    bottom: 9px;
    left: 9px;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border-radius: 0.25rem;
    width: 20rem;
    border-width: 0;
    border-radius: 0.4rem;
    box-shadow: 0 2px 6px 0 rgba(114, 124, 245, 0.5);
    -ms-flex: 1 1 auto;
    flex: 1 1 auto;
    padding: 0.75rem 1.25rem;
    z-index: 99999;

    > p {
      display: inline;
    }

    .btn {
      margin-top: 3px;
    }
  }
}
</style>
