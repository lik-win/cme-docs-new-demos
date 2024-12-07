export function getWindBardIcon(speed, type) {
  if (type === "barb") {
    if (speed === 0) {
      return "&#xe796";
    } else if (speed > 0 && speed <= 2) {
      return "&#xe794";
    } else if (speed > 2 && speed <= 4) {
      return "&#xe795";
    } else if (speed > 4 && speed <= 6) {
      return "&#xe793";
    } else if (speed > 6 && speed <= 8) {
      return "&#xe791";
    } else if (speed > 8 && speed <= 10) {
      return "&#xe792";
    } else if (speed > 10 && speed <= 12) {
      return "&#xe781";
    } else if (speed > 12 && speed <= 14) {
      return "&#xe790";
    } else if (speed > 14 && speed <= 16) {
      return "&#xe782";
    } else if (speed > 16 && speed <= 18) {
      //TODO 风速问题
      return "&#xe78f";
    } else if (speed > 18 && speed <= 20) {
      return "&#xe78e";
    } else if (speed > 20 && speed <= 22) {
      return "&#xe78d";
    } else if (speed > 22 && speed <= 24) {
      return "&#xe78b";
    } else if (speed > 24 && speed <= 26) {
      return "&#xe783";
    } else if (speed > 26 && speed <= 28) {
      return "&#xe78c";
    } else if (speed > 28 && speed <= 30) {
      return "&#xe78a";
    } else if (speed > 30 && speed <= 32) {
      return "&#xe787";
    } else if (speed > 32 && speed <= 34) {
      return "&#xe789";
    } else if (speed > 34 && speed <= 36) {
      return "&#xe785";
    } else if (speed > 36 && speed <= 38) {
      return "&#xe788";
    } else if (speed > 38 && speed <= 40) {
      return "&#xe786";
    } else if (speed > 40 && speed <= 42) {
      return "&#xe784";
    }
  } else {
    return "&#xe74b";
  }
}
export function getWindSpeedAndDirection(u, v) {
  let dir = 270.0 - (Math.atan2(v, u) * 180.0) / Math.PI + 180;
  if (dir >= 360) dir = dir - 360;
  return dir;
}


export  function  getWindSpeed (u,v){
  return Math.sqrt(u*u+v*v)
}
export function getColorByValue(value, legend) {
  // 遍历 legend 数组
  for (let i = 0; i < legend.length; i++) {
    let threshold = legend[i][0];
    let color = legend[i][1];
    // 如果给定的值小于当前阈值，则返回当前颜色
    if (value <= threshold) {
      return "rgb(" + color.join(", ") + ")";
    }
  }
  // 如果给定的值大于所有阈值，则返回最后一个颜色
  let lastColor = legend[legend.length - 1][1];
  return "rgb(" + lastColor.join(", ") + ")";
}

function parseColor(color) {
  // 如果颜色值是十六进制格式，则进行转换
  if (color[0] === "#") {
    // 将十六进制颜色转换为 RGB 格式
    var hex = color.slice(1);
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return { r: r, g: g, b: b };
  }
  // 如果颜色值是 RGBA 格式，则进行解析
  else if (color.startsWith("rgb")) {
    var rgbaArray = color
      .substring(color.indexOf("(") + 1, color.lastIndexOf(")"))
      .split(",");
    var r = parseInt(rgbaArray[0]);
    var g = parseInt(rgbaArray[1]);
    var b = parseInt(rgbaArray[2]);
    return { r: r, g: g, b: b };
  }
  // 其他格式暂不支持
  else {
    throw new Error("Unsupported color format");
  }
}

export function isDark(color) {
  // 解析颜色并获取 RGB 分量
  var rgb = parseColor(color);
  var r = rgb.r;
  var g = rgb.g;
  var b = rgb.b;

  // 计算亮度
  var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // 判断颜色深浅
  return luminance <= 160;
}

export function getColorBasedOnBrightness(color) {
  // 根据颜色深浅返回相应的颜色值
  if (isDark(color)) {
    return "#FFFFFF"; // 深色返回白色
  } else {
    return "#000000"; // 浅色返回黑色
  }
}

export function getWindLevelNumber(windSpeed) {
  let levelNumber;
  if (windSpeed <= 0.2) {
    levelNumber = 0;
  } else if (windSpeed > 0.2 && windSpeed <= 1.5) {
    levelNumber = 1;
  } else if (windSpeed > 1.5 && windSpeed <= 3.3) {
    levelNumber = 2;
  } else if (windSpeed > 3.3 && windSpeed <= 5.4) {
    levelNumber = 3;
  } else if (windSpeed > 5.4 && windSpeed <= 7.9) {
    levelNumber = 4;
  } else if (windSpeed > 7.9 && windSpeed <= 10.7) {
    levelNumber = 5;
  } else if (windSpeed > 10.7 && windSpeed <= 13.8) {
    levelNumber = 6;
  } else if (windSpeed > 13.8 && windSpeed <= 17.1) {
    levelNumber = 7;
  } else if (windSpeed > 17.1 && windSpeed <= 20.7) {
    levelNumber = 8;
  } else if (windSpeed > 20.7 && windSpeed <= 24.4) {
    levelNumber = 9;
  } else if (windSpeed > 24.4 && windSpeed <= 28.4) {
    levelNumber = 10;
  } else if (windSpeed > 28.4 && windSpeed <= 32.6) {
    levelNumber = 11;
  } else if (windSpeed > 32.6 && windSpeed <= 36.9) {
    levelNumber = 12;
  } else if (windSpeed > 36.9 && windSpeed <= 41.4) {
    levelNumber = 13;
  } else if (windSpeed > 41.4 && windSpeed <= 46.1) {
    levelNumber = 14;
  } else if (windSpeed > 46.1 && windSpeed <= 50.9) {
    levelNumber = 15;
  } else if (windSpeed > 50.9 && windSpeed <= 56.0) {
    levelNumber = 16;
  } else {
    levelNumber = 17;
  }
  return levelNumber;
}

export function determineWindDirection(angle) {
  angle = angle ? angle : 0;
  let direction;
  if (angle >= 348.75 || angle <= 11.25) {
    direction = "北风";
  } else if (angle > 11.25 && angle <= 33.75) {
    direction = "东北偏北风";
  } else if (angle > 33.75 && angle <= 56.25) {
    direction = "东北风";
  } else if (angle > 56.25 && angle <= 78.75) {
    direction = "东北偏东风";
  } else if (angle > 78.75 && angle <= 101.25) {
    direction = "东风";
  } else if (angle > 101.25 && angle <= 123.75) {
    direction = "东南偏东风";
  } else if (angle > 123.75 && angle <= 146.25) {
    direction = "东南风";
  } else if (angle > 146.25 && angle <= 168.75) {
    direction = "东南偏南风";
  } else if (angle > 168.75 && angle <= 191.25) {
    direction = "南风";
  } else if (angle > 191.25 && angle <= 213.75) {
    direction = "西南偏南风";
  } else if (angle > 213.75 && angle <= 236.25) {
    direction = "西南风";
  } else if (angle > 236.25 && angle <= 258.75) {
    direction = "西南偏西风";
  } else if (angle > 258.75 && angle <= 281.25) {
    direction = "西风";
  } else if (angle > 281.25 && angle <= 303.75) {
    direction = "西北偏西风";
  } else if (angle > 303.75 && angle <= 326.25) {
    direction = "西北风";
  } else if (angle > 326.25 && angle <= 348.75) {
    direction = "西北偏北风";
  }
  return direction;
}
