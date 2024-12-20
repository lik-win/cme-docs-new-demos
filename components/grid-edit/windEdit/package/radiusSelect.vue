<template>
  <div
      ref="setup_angle"
      class="setup_angle"
      @mousedown="mousedown = true"
      @mouseup="mousedown = false"
      @mousemove="on_mousemove"
      @mouseleave="mousedown=false">
    <div class="clock">
      <span  @click="ev_selectAngle(0)">北</span>
      <span @click="ev_selectAngle(45)"></span>
      <span @click="ev_selectAngle(90)">东</span>
      <span @click="ev_selectAngle(135)"></span>
      <span @click="ev_selectAngle(180)">南</span>
      <span @click="ev_selectAngle(225)"></span>
      <span @click="ev_selectAngle(270)">西</span>
      <span @click="ev_selectAngle(315)"></span>
    </div>
      <div
        class="container"
        :style="{
                transform:'rotate('+angle_data+'deg)',
            }">
      <div class="point"></div>

    </div>
    <div class="content">
      {{ angle_data+'°' }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'setup_angle',
  data(){
    return{
      angle_data:0,
      mousedown:false, //鼠标是否按下
    };
  },
  methods:{
    calculate_degree(x, y, centerX, centerY) { //根据当前坐标和中心坐标计算角度
      const radians = Math.atan2(x - centerX, y - centerY);
      return (radians * (180 / Math.PI) * -1) + 180;
    },
    on_mousemove(event){
      event.preventDefault()//鼠标移动事件(按下移动就算拖拽，在元素里移动才算，元素外移动监听)
      if(this.mousedown){ //表示是按下移动的
        const setup_angle = this.$refs.setup_angle;
        let centerX = -~(setup_angle.offsetHeight || setup_angle.height)/2;
        let centerY = -~(setup_angle.offsetWidth || setup_angle.width)/2;
        let angle = this.calculate_degree(event.offsetX,event.offsetY,centerX,centerY);
        this.angle_data = -~angle;
        this.$emit('angle',angle); //发送事件
      }
    },
    ev_selectAngle(angle){
      event.preventDefault()
      this.angle_data = angle;
      this.$emit('angle',angle); //发送事件
    }
  },
}
</script>

<style scoped lang="scss">
.clock {
  position: absolute;
  top: 50%;
  aspect-ratio: 1;
  left: 50%;
  height:var(--_w);
  transform: translate(-50%, -50%);
  width: var(--_w);
  --radius:  calc((var(--_w) - var(--_sz)) / 2);
}
.clock span {
  cursor: pointer;
  user-select: none;
  /* 计算每个时间标记的位置 */
  --x: calc(var(--radius) + (var(--radius) * cos(var(--index) * 45deg)));
  --y: calc(var(--radius) + (var(--radius) * sin(var(--index) * 45deg)));
  display: grid;
  height: var(--_sz);
  left: var(--x);
  place-content: center;
  position: absolute;
  top: var(--y);
  width: var(--_sz);
}
.clock span:nth-child(1) { --index:6; }
.clock span:nth-child(2) { --index: 7; }
.clock span:nth-child(3) { --index: 0; }
.clock span:nth-child(4) { --index: 1; }
.clock span:nth-child(5) { --index: 2; }
.clock span:nth-child(6) { --index: 11; }
.clock span:nth-child(7) { --index: 4; }
.clock span:nth-child(8) { --index: 5; }

.number {
  cursor: pointer;
  box-sizing: border-box;
  user-select: none;
  --rotate: 0;
  position: absolute;
  width: 100%;
  height: 100%;
  text-align: center;
  color: black;
  font-size:16px;
  transform-origin: center;
  transform: rotate(var(--rotate));
  padding-top: 5px;
}

.number-1 {
  --rotate: 30deg;
}
.number-2 {
  --rotate: 60deg;
}
.number-3 {
  --rotate: 90deg;
}
.number-4 {
  --rotate: 120deg;
}
.number-5 {
  --rotate: 150deg;
}
.number-6 {
  --rotate: 180deg;
}
.number-7 {
  --rotate: 210deg;
}
.number-8 {
  --rotate: 240deg;
}
.number-9 {
  --rotate: 270deg;
}
.number-10 {
  --rotate: 300deg;
}
.number-11 {
  --rotate: 330deg;
}
.number-12 {
  --rotate: 360deg;
}

.setup_angle{
  --_sz: 20px;
  --_w: 100px;
  width: var(--_w);
  height:var(--_w);
  border: 3px solid red;
  box-sizing: border-box;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  >.container{
    position: relative;
    pointer-events: none;
    height: 80%;
    width: fit-content;
    box-sizing: border-box;
    cursor: pointer;
    transition: all .3s;
    >.point{
      cursor: pointer;
      width: 15px;
      height: 40%;
      background-color: #e84545;
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    }
  }
  >.content{
    position:absolute;
    font-size: 16px;
    color: #5b748e;
    font-weight: bold;
    pointer-events: none;
  }

}
</style>

