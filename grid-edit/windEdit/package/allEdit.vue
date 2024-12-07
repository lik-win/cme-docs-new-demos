<script setup>
import { addGridLayer } from './addGridLayer.js'
import './font/iconfont.css'

const initGridLayer = (view, dimensions, config) => {
  let data = {
    elementConfig: config,
    sdui: JSON.stringify(dimensions),
  }
  addGridLayer(view, data)
}

const editGridLayer = (view, dimensions, config) => {
  let data = {
    elementConfig: config,
    sdui: JSON.stringify(dimensions),
  }
  addGridLayer(view, data)
}

defineExpose({
  initGridLayer,
  editGridLayer,
})
</script>

<template></template>

<style scoped lang="scss"></style>
