<script setup>
import cogTif  from './cogTif.vue';

</script>

<Container>

<LeftSide>

### **10米风要素编辑**
CMA_MESO 10米风要素编辑（包括风速、风向）


</LeftSide>

<RightSide>
<show-code showPath="demos/interactive/gridEdit/PolygonEdit/cogTif" >
    <cogTif></cogTif>
</show-code>

</RightSide>
</Container>

<style scoped>
.markdown-body {
    width: 100%;
    height: calc(100% - 55px); font-size: 16px;
  }
</style>
