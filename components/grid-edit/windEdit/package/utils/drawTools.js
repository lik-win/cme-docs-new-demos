import { Collection, Feature } from "CME2D";
import { DragPan, Draw, Modify, Select, Snap } from "CME2D/interaction";
import { GeoJSON } from "CME2D/format";
import { Circle, Fill, Stroke, Style, Text } from "CME2D/style";
import PointGeo from "CME2D/geom/Point.js";
import identity from "./shi.png";
import CircleGeo from "CME2D/geom/Circle.js";
import { Vector as VectorLayer } from "CME2D/layer";
import { Vector as VectorSource } from "CME2D/source";
import { createBox, createRegularPolygon } from "CME2D/interaction/Draw";
import { LineString, Point, Polygon } from "CME2D/geom";
import { fromCircle } from "CME2D/geom/Polygon.js";
import axios from "axios";
import  * as  turf from '@turf/turf'
import { Icon } from "CME2D/style.js";
let currentEditFeature = null; // 当前存储的feature
let currentStyle = false; // 当前打点的样式
class DrawingTool {
  constructor(map) {
    this.map = map;
    this.color = "#2BCC67";
    this.vectorSource = new VectorSource({ wrapX: false });
    this.vectorAssistantSource = new VectorSource({ wrapX: false });
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      name: "drawTool",
      layerName: "drawTool",
      wrapX: false,
      zIndex: 1000,
      // style: {
      //   'fill-color': 'rgba(255, 255, 255, 0.3)',
      //   'stroke-color': '#ffcc33',
      // },
    });
    this.vectorAssistantLayer = new VectorLayer({
      source: this.vectorAssistantSource,
      name: "drawToolHelp",
      layerName: "drawToolHelp",
      zIndex: 999,
      style: new Style({
        image: new Icon({
          src: identity,
          width: 24,
          height: 24,
          crossOrigin: "anonymous",
        }),
      }),
    });
    this.select = new Select(); // 创建 Select 交互工具
    this.draw = null;
    this.snap = new Snap({ source: this.vectorSource });
    this.modify = null;
    this.map.addLayer(this.vectorLayer);
    this.map.addLayer(this.vectorAssistantLayer);
    this.map.addInteraction(this.snap); // 添加 Snap 交互工具到地图
    this.pan = this.getPan();
  }

  getPan() {
    let pan = null;
    this.map.getInteractions().forEach((element) => {
      if (element instanceof DragPan) {
        pan = element;
      }
    });
    return pan;
  }

  makeSmooth(path, numIterations) {
    let line = turf.lineString(path);
    let curved = turf.bezierSpline(line);
    let cords = curved?.features[0]?.geometry?.coordinates[0] ?? [];
    return cords;
  }
  makePolygonSmooth(path, number) {
    let res = turf.polygon([path], { name: "poly1" });
    let smoothed = turf.polygonSmooth(res, { iterations: number ?? 3 });
    let cords = smoothed?.features[0]?.geometry?.coordinates[0] ?? [];
    return cords;
  }

  clickCallBack = (event) => {
    const cords = event.coordinate;
    let isolineLayer = null;
    let pixel = this.map.getPixelFromCoordinate(cords);
    this.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
      if (layer?.values_?.layerName === "isolineArr") {
        isolineLayer = layer;
        currentEditFeature = feature;
        currentStyle = true;
        return true; // 停止检测其他 feature
      }
    });
    let feature = new Feature({
      geometry: new Point(cords),
    });
    if (currentStyle) {
      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({
              color: "red",
            }),
            stroke: new Stroke({
              color: "white",
              width: 2,
            }),
          }),
        }),
      );
      currentStyle = false;
    } else {
      feature.setStyle(
        new Style({
          image: new Icon({
            src: identity, // 图片路径
            width: 24,
            height: 24,
            crossOrigin: "anonymous", // 如果图片服务器支持CORS，使用anonymous
            // 您可以添加其他Icon属性，如size, anchor等
          }),
        }),
      );
    }
    this.vectorAssistantSource.addFeature(feature);
    this.vectorAssistantSource.changed();
    // this.vectorAssistantLayer.setZIndex(9999);
  };

  // 自定义条件函数，只有左键点击时才允许绘制
  leftClickOnly = function (event) {
    // 检查是否为左键点击
    let isLeftClick = event.originalEvent.button === 0;
    // 检查是否按下了Ctrl键
    let isCtrlPressed = event.originalEvent.ctrlKey;

    // 只有当是左键点击且没有按下Ctrl键时，才返回true
    return isLeftClick && !isCtrlPressed;
  };

  createDrawInteraction(type, geometryFunction, freehand, gName) {
    this.draw = new Draw({
      type,
      geometryName: gName,
      condition: this.leftClickOnly, // 使用自定义条件函数
      finishCondition: this.customFinishCondition,
      geometryFunction, //绘制几何函数
      source: this.vectorSource,
      freehand,
      dragVertexDelay: 0,
      wrapX: true,
      style: function (feature) {
        return new Style({
          stroke: new Stroke({
            color: "rgba(0,0,255,0.7)", // 黄色边框
            width: 2,
          }),
        });
      },
    });
    this.map.addInteraction(this.draw);
    this.snap = new Snap({ source: this.vectorSource });
    this.map.addInteraction(this.snap);
    // this.draw.on("drawstart", (event) => {
    //   this.map.on("click", this.clickCallBack);
    //   // 监听双击事件来继续绘制
    //   const rightClickListener = function (e) {
    //     if (e.button === 2) {
    //       // 检查是否为右键点击
    //       that.draw.finishDrawing(); // 结束绘制
    //       // 移除右键点击事件监听器
    //       that.map
    //         .getViewport()
    //         .removeEventListener("contextmenu", rightClickListener);
    //       e.preventDefault(); // 阻止默认的右键菜单
    //     }
    //   };
    //   // 监听地图视图上的右键点击事件
    //   that.map
    //     .getViewport()
    //     .addEventListener("contextmenu", rightClickListener);
    //   // 移除所有的平移交互
    //   var coordinates = event.feature.getGeometry().getCoordinates();
    //   const extent = [0, -90, 360, 90];
    //   const pixelSize = 1; // 像素大小
    //   //
    // });
    // this.draw.on("drawend", (event) => {
    //   this.pan.setActive(true);
    //   // 在绘制结束时移除右键点击事件监听器
    //   this.map.un("click", this.clickCallBack);
    //   this.vectorAssistantSource.clear();
    //   const feature = event.feature;
    //   if (feature.geometryName_ === "PolylineSmooth") {
    //     // this.vectorSource.clear();
    //     // this.vectorAssistantSource.clear();
    //   }
    //   const geometry = feature.getGeometry();
    //   // 将要素转换为 GeoJSON 格式
    //   // 将圆形转换为多边形
    //   if (feature.geometryName_ === "Circle") {
    //     const polygonGeometry = fromCircle(geometry);
    //     // 创建多边形要素
    //     const polygonFeature = new Feature(polygonGeometry);
    //     const format = new GeoJSON();
    //     const geoJSON = format.writeFeature(polygonFeature);
    //   } else if (
    //     feature.geometryName_ === "PolygonSmooth" ||
    //     feature.geometryName_ === "PolylineSmooth"
    //   ) {
    //     feature.setStyle(
    //       new Style({
    //         stroke: new Stroke({
    //           color: "blue", // 黄色边框
    //           width: 3,
    //         }),
    //       }),
    //     );
    //     const geometry = feature.getGeometry();
    //     let coordinates = geometry.getCoordinates();
    //     feature.geometryName_ === "PolygonSmooth"
    //       ? coordinates.push(coordinates[0])
    //       : "";
    //     // 然后进行平滑处理
    //     const smoothedCoordinates =
    //       feature.geometryName_ === "PolygonSmooth"
    //         ? this.makePolygonSmooth(coordinates, 3)
    //         : this.makeSmooth(coordinates, 3);
    //     if (feature.geometryName_ === "PolylineSmooth") {
    //       feature.set("name", "editIlolineFeature");
    //     }
    //     geometry.setCoordinates(smoothedCoordinates);
    //     let timestamp = Date.now();
    //     const format = new GeoJSON();
    //     // 创建 GeoJSON 对象
    //     if (feature.geometryName_ === "PolygonSmooth") {
    //       const geojsonPolygon = {
    //         type: "Feature",
    //         geometry: {
    //           type: "Polygon",
    //           coordinates: [smoothedCoordinates],
    //         },
    //         properties: {
    //           name: "My Polygon",
    //         },
    //       };
    //       axios
    //         .post(`${PORT_8882}/v8/saveGoJsonData`, {
    //           dataId: timestamp,
    //           data: JSON.stringify(geojsonPolygon),
    //         })
    //         .then((res) => {
    //           let msg = res?.data?.msg;
    //           let code = res?.data?.code;
    //           if (code === 201) {
    //             ElMessage.info(msg);
    //             this.vectorSource.clear();
    //           } else {
    //             // store.clearDrawName();
    //             store.setDrawName({
    //               timestamp,
    //               feature: feature,
    //             });
    //           }
    //         });
    //     } else {
    //       if (currentEditFeature) {
    //         // 判断是否有相交
    //         polygonLines(currentEditFeature, feature)
    //           .then((res) => {
    //             this.vectorSource.clear();
    //             this.vectorAssistantSource.clear();
    //             currentEditFeature.getGeometry().setCoordinates(res);
    //             const format = new GeoJSON();
    //             const geoJSON = format.writeFeature(currentEditFeature);
    //             let timestamp = Date.now();
    //             axios
    //               .post(`${PORT_8882}/v8/saveGoJsonData`, {
    //                 dataId: timestamp,
    //                 data: geoJSON,
    //               })
    //               .then((res) => {
    //                 let msg = res?.data?.msg;
    //                 let code = res?.data?.code;
    //                 if (code === 201) {
    //                   ElMessage.info(msg);
    //                   this.vectorSource.clear();
    //                   this.vectorAssistantLayer.clear();
    //                 } else {
    //                   // store.clearDrawName();
    //                   store.setDrawName({
    //                     timestamp,
    //                     feature: feature,
    //                   });
    //                 }
    //               });
    //           })
    //           .catch((err) => {
    //             this.vectorSource.clear();
    //             this.vectorAssistantSource.clear();
    //             ElMessage.info(err);
    //           });
    //       }
    //     }
    //   } else {
    //     const format = new GeoJSON();
    //     const geoJSON = format.writeFeature(feature);
    //     let timestamp = Date.now();
    //     axios
    //       .post(`${PORT_8882}/v8/saveGoJsonData`, {
    //         dataId: timestamp,
    //         data: geoJSON,
    //       })
    //       .then((res) => {
    //         let msg = res?.data?.msg;
    //         let code = res?.data?.code;
    //         if (code === 201) {
    //           ElMessage.info(msg);
    //           this.vectorSource.clear();
    //         } else {
    //           // store.clearDrawName();
    //           store.setDrawName({
    //             timestamp,
    //             feature: feature,
    //           });
    //         }
    //       });
    //     // this.map.removeInteraction(this.draw);
    //
    //     // let radius = null
    //   }
    // });
    //监听编辑完成事件
  }

  drawStart(callBack) {
    let that = this;
    this.draw.on("drawstart", (event) => {
      this.map.on("click", this.clickCallBack);
      // 监听双击事件来继续绘制
      const rightClickListener = function (e) {
        if (e.button === 2) {
          // 检查是否为右键点击
          that.draw.finishDrawing(); // 结束绘制
          // 移除右键点击事件监听器
          that.map
            .getViewport()
            .removeEventListener("contextmenu", rightClickListener);
          e.preventDefault(); // 阻止默认的右键菜单
        }
      };
      // 监听地图视图上的右键点击事件
      that.map
        .getViewport()
        .addEventListener("contextmenu", rightClickListener);
      // 移除所有的平移交互
      callBack(event);
    });
  }

  drawEnd(callBack) {
    this.draw.on("drawend", (event) => {
      // 在绘制结束时移除右键点击事件监听器
      this.map.un("click", this.clickCallBack);
      this.vectorAssistantSource.clear();
      const feature = event.feature;
      const geometry = feature.getGeometry();
      feature.setStyle(
        new Style({
          stroke: new Stroke({
            color: "blue", // 黄色边框
            width: 3,
          }),
          fill: new Fill({
            color: "rgba( 0, 0, 255, 0.1)", // 蓝色填充
          }),
        }),
      );
      if (feature.geometryName_ === "Circle") {
        const polygonGeometry = fromCircle(geometry);
        // 创建多边形要素
        const polygonFeature = new Feature(polygonGeometry);
        const format = new GeoJSON();
        const geoJSON = format.writeFeature(polygonFeature);
      } else if (
        feature.geometryName_ === "PolygonSmooth" ||
        feature.geometryName_ === "PolylineSmooth"
      ) {
        const geometry = feature.getGeometry();
        let coordinates = geometry.getCoordinates();
        feature.geometryName_ === "PolygonSmooth"
          ? coordinates.push(coordinates[0])
          : "";
        // 然后进行平滑处理
        const smoothedCoordinates =
          feature.geometryName_ === "PolygonSmooth"
            ? this.makePolygonSmooth(coordinates, 3)
            : this.makeSmooth(coordinates, 3);
        if (feature.geometryName_ === "PolylineSmooth") {
          feature.set("name", "editIlolineFeature");
        }
        geometry.setCoordinates(smoothedCoordinates);
        callBack(feature);
      }
    });
  }
  customFinishCondition(event) {
    const originalEvent = event.originalEvent; // 获取原生事件对象
    // return originalEvent.button === 2; // 检查是否是鼠标右键点击
    if (originalEvent.button === 2) {
      return true;
    } else return false;
  }

  convertCoordinates(coords, type) {
    if (type === "Circle" || type === "Point") {
      return coords.join(",");
    } else if (type === "LineString") {
      return coords.map((point) => `${point[0]}, ${point[1]}`).join(" | ");
    } else {
      return coords[0].map((point) => `${point[0]}, ${point[1]}`).join(" | ");
    }
  }
  setStyleColor(color = "#2BCC67", title = "") {
    this.vectorLayer.setStyle(
      new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color,
          }),
          stroke: new Stroke({
            color: "white",
            width: 2,
          }),
        }),
        radius: 6,
        fill: new Fill({
          color,
        }),
        stroke: new Stroke({
          color,
          width: 2,
        }),
        text: new Text({
          text: title,
          fill: new Fill({
            color: "black",
          }),
        }),
      }),
    );
  }
  //为每个feaute 单独设置样式
  setFeauteStyle(color, title, feature) {
    const style = new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color,
        }),
        stroke: new Stroke({
          color: "white",
          width: 2,
        }),
      }),
      radius: 6,
      fill: new Fill({
        color,
      }),
      stroke: new Stroke({
        color,
        width: 2,
      }),
      text: new Text({
        text: title,
        fill: new Fill({
          color: "black",
        }),
      }),
    });
    feature.setStyle(style);
  }
  drawInteraction(val, bool) {
    if (this.draw && !bool) {
      // 判断draw是否为空，若不为空移除上一个绘图交互
      this.clear();
    }
    switch (val) {
      case "Cancel": // 取消绘制
        break;
      case "PolygonSmooth":
        this.createDrawInteraction(
          "LineString",
          undefined,
          false,
          "PolygonSmooth",
        );
        break;
      case "PolylineSmooth":
        this.createDrawInteraction(
          "LineString",
          undefined,
          false,
          "PolylineSmooth",
        );
        break;
      case "Polygon": // 绘制规则图形
        this.createDrawInteraction("Polygon", undefined, false, "Polygon");
        break;
      case "ArbPolygon": // 绘制不规则图形
        this.createDrawInteraction("Polygon", undefined, true, "ArbPolygon");
        break;
      case "Square": // 绘制正方形
        // 定义一个4条边的多边形几何函数
        this.createDrawInteraction(
          "Circle",
          createRegularPolygon(4),
          true,
          "Square",
        );
        break;
      case "Circle": // 绘制圆形
        this.createDrawInteraction("Circle", undefined, true, "Circle");
        break;
      case "LineString": // 绘制圆形
        this.createDrawInteraction(
          "LineString",
          undefined,
          false,
          "LineString",
        );
        break;
      case "Rectangle": // 绘制矩形
        // 定义一个矩形几何函数
        this.createDrawInteraction("Circle", createBox(), true, "Rectangle");
        break;
      case "Point": // 绘制点、圆、折线、规则多边形
        this.createDrawInteraction("Point", undefined, false, "Point");
        break;
      default:
        break;
    }
  }
  clear() {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
      this.vectorSource.clear();
      this.vectorAssistantSource.clear();
    }
  }
  clearFeature() {
    this.vectorSource.clear();
    this.vectorAssistantSource.clear();
  }
  clearInteraction() {
    if (this.draw) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
      this.vectorAssistantSource.clear();
    }
  }
  setFeature(data) {
    // let feature = null
    if (data.geometryName === "Point") {
      const cords = data.data.split(",");
      //点
      const feature = new Feature({
        geometry: new PointGeo([Number(cords[0]), Number(cords[1])]),
        geometryName: data.geometryName,
      });
      feature.setId(data.id); // 设置要素的 ID
      this.setFeauteStyle(data.color, data.title, feature);
      this.vectorSource.addFeature(feature);
      const extent = feature.getGeometry().getExtent();
      setTimeout(() => {
        this.map
          .getView()
          .fit(extent, { padding: [50, 50, 50, 50], duration: 2000 });
      }, 200);
    } else if (data.geometryName === "Circle") {
      const cords = data.data.split(",");
      //点
      const circleRadius =
        data?.radius && this.lengthToPixel(data.radius, this.map);
      const feature = new Feature({
        geometry: new CircleGeo(
          [Number(cords[0]), Number(cords[1])],
          circleRadius,
        ),
        geometryName: data.geometryName,
      });
      console.log(feature, "feature");
      feature.setId(data.id); // 设置要素的 ID
      this.setFeauteStyle(data.color, data.title, feature);
      this.vectorSource.addFeature(feature);
      const extent = feature.getGeometry().getExtent();
      setTimeout(() => {
        this.map
          .getView()
          .fit(extent, { padding: [50, 50, 50, 50], duration: 2000 });
      }, 200);
    } else if (data.geometryName === "LineString") {
      const cords = this.convertToPolygonCoordinates(data.data);
      const feature = new Feature({
        geometry: new LineString(cords),
        geometryName: data.geometryName,
      });
      feature.setId(data.id); // 设置要素的 ID
      this.setFeauteStyle(data.color, data.title, feature);
      this.vectorSource.addFeature(feature);
      const extent = feature.getGeometry().getExtent();
      setTimeout(() => {
        this.map
          .getView()
          .fit(extent, { padding: [50, 50, 50, 50], duration: 2000 });
      }, 200);
    } else if (
      data.geometryName === "Square" ||
      data.geometryName === "Polygon"
    ) {
      const cords = this.convertToPolygonCoordinates(data.data);
      const feature = new Feature({
        geometry: new Polygon(cords),
        geometryName: data.geometryName,
      });
      feature.setId(data.id); // 设置要素的 ID
      this.setFeauteStyle(data.color, data.title, feature);
      this.vectorSource.addFeature(feature);
      const extent = feature.getGeometry().getExtent();
      setTimeout(() => {
        this.map
          .getView()
          .fit(extent, { padding: [50, 50, 50, 50], duration: 2000 });
      }, 200);
    }
  }
  convertToPolygonCoordinates(coordinates) {
    const coords = coordinates.split("|"); // 将坐标字符串分割成单个坐标对
    const polygonCoords = coords.map((coord) => coord.split(",").map(Number)); // 将每个坐标对转换为 [经度, 纬度] 数组，并解析为浮点数
    polygonCoords.push(polygonCoords[0]); // 添加起始坐标到数组末尾，形成闭合的多边形
    return [polygonCoords]; // 返回多边形坐标的数组
  }

  //根据id查询是否有对于feaute
  findFeatureById(id) {
    return this.vectorSource.getFeatureById(id);
  }
  removeFeature(feature) {
    this.vectorSource.removeFeature(feature);
  }

  //将米转换为真实像素距离
  lengthToPixel(realDistance, map) {
    // 获取地图视图的分辨率
    const resolution = map.getView().getResolution();

    // 获取地图投影坐标系单位长度（每个单位对应的米数）
    const metersPerUnit = map.getView().getProjection().getMetersPerUnit();

    // 使用单位长度将真实距离（米）转换为像素距离
    const pixelDistance = realDistance / (resolution * metersPerUnit);

    return pixelDistance;
  }

  //像素转换为 M 单位
  convertPixelToMeter(radius, map) {
    // 获取地图视图的分辨率
    const resolution = map.getView().getResolution();

    // 获取地图投影坐标系单位长度（每个单位对应的米数）
    const metersPerUnit = map.getView().getProjection().getMetersPerUnit();

    // 使用单位长度将像素距离转换为真实距离（米）
    const realDistance = radius * resolution * metersPerUnit;

    return realDistance;
  }

  //控制feature 显示/隐藏
  showFeatureStyle(feature, show) {
    feature.setStyle(null);
  }

  editFeature(feature) {
    console.log(feature.id_);
    this.removeModifyInteraction();
    this.modify = new Modify({
      features: new Collection([feature]),
    });
    this.map.addInteraction(this.modify);
    //编辑完成事件
    this.modify.on("modifyend", (event) => {
      this.onModifyEnd(feature?.id_);
    });
  }
  //修改完成监听
  onModifyEnd = (id) => {
    console.log("修改完成:", id);
    const feature = this.findFeatureById(id);
    const geometryName = feature?.values_.geometryName;
    if (feature) {
      const geometry = feature.getGeometry();
      let radius = null;
      let data = null;
      if (geometryName && geometryName === "Circle") {
        radius = geometry.getRadius();
        data = geometry.getCenter();
      } else {
        data = geometry.getCoordinates();
      }
      const parmas = {
        id: undefined,
        data: this.convertCoordinates(data, geometryName),
        radius: radius ? this.convertPixelToMeter(radius, this.map) : null,
        color: this.color,
      };
    }
  };

  cancelEdit() {
    this.removeModifyInteraction();
  }

  removeModifyInteraction() {
    if (this.modify) {
      this.map.removeInteraction(this.modify);
      this.modify = null;
    }
  }
}

export default DrawingTool;
