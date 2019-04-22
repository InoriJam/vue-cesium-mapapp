<template>
  <div id="app">
    <router-view/>
    <div id="layout">
      <div class="input-group" id="search_group">
        <input type="text" class="form-control" placeholder="请输入地点" id="search">
        <span class="input-group-btn">
          <button class="btn btn-primary" type="button" v-on:click='search()'>搜索</button>
        </span>
        <span class="input-group-btn">
          <button
            class="btn btn-primary"
            type="button"
            data-toggle="collapse"
            data-target="#collapseExample"
          >路径规划</button>
          <button class="btn btn-primary" id="navi" type="button" v-on:click='clickHandler()'>导航</button>
        </span>
      </div>
      <div class="collapse" id="collapseExample">
        <div class="well">
          <input type="text" class="form-control" placeholder="请输入起点" id="orig">
          <input type="text" class="form-control" placeholder="请输入终点" id="dest">
          <button class="btn btn-primary btn-block" type="button" v-on:click="routine()">规划</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      queryString: {
        keyWord: "",
        level: "",
        mapBound: "-180,-90,180,90",
        queryType: "1",
        count: "20",
        start: "0"
      },
      routineString: {
        orig: "",
        dest: "",
        style: "0"
      },
      document: document
    };
  },
  methods: {
    line:function(arr){
      if (this.line_primitive){
      this.$root.viewer.scene.primitives.remove(this.line_primitive);
      }
     this.line_primitive = new this.Cesium.Primitive({
  geometryInstances : new this.Cesium.GeometryInstance({
    geometry : new this.Cesium.PolylineGeometry({
      positions : this.Cesium.Cartesian3.fromDegreesArray(arr),//坐标必须两个和两个以上
      width : 10.0,//线宽
      vertexFormat : this.Cesium.PolylineColorAppearance.VERTEX_FORMAT
    }),
    attributes : {
         color : this.Cesium.ColorGeometryInstanceAttribute.fromColor(this.Cesium.Color.DEEPPINK),//color  必须设置 不然没有效果
    }
  }),
  appearance : new this.Cesium.PolylineColorAppearance({
    translucent : false
  })
});
  this.$root.viewer.scene.primitives.add(this.line_primitive);
    },
    mark: function(text, fontsize) {
      var canvas = document.createElement("canvas"); //创建canvas标签
      var ctx = canvas.getContext("2d");

      ctx.fillStyle = "#99f";
      ctx.font = fontsize + "px Arial";

      canvas.width = ctx.measureText(text).width + fontsize * 2; //根据文字内容获取宽度
      canvas.height = fontsize * 2; // fontsize * 1.5

      //ctx.drawImage(img, fontsize/2,fontsize/2,fontsize,fontsize);

      ctx.fillStyle = "#000";
      ctx.font = fontsize + "px Calibri,sans-serif";
      ctx.shadowOffsetX = 1; //阴影往左边偏，横向位移量
      ctx.shadowOffsetY = 0; //阴影往左边偏，纵向位移量
      ctx.shadowColor = "#fff"; //阴影颜色
      ctx.shadowBlur = 1; //阴影的模糊范围
      ctx.fillText(text, (fontsize * 7) / 4, (fontsize * 4) / 3);
      return canvas;
    },
    reqroutine: function(){
      this.$http
        .get("https://api.tianditu.gov.cn/drive", {
          params: {
            postStr: JSON.stringify(this.routineString),
            type: "search",
            tk: "487eb887daf6007edad24dc0a1a62121"
          }
        })
        .then(
          response => {
            //success
            var domParser = new DOMParser();
            var xmlDoc = domParser.parseFromString(response.body, 'text/xml');
            var routelatlon = xmlDoc.getElementsByTagName("routelatlon")[0].firstChild.nodeValue;
            var arr = routelatlon.split(/[,;]/);
            arr.pop();
            arr = arr.map(function(item) {
                return parseFloat(item);
              });
            this.line(arr);
            //console.log(arr);
          },
          //failed
          function() {
            alert("failed");
          }
        );
    },
    clickHandler: function(){
      var value = document.getElementById("navi").innerHTML;
      if (value == "导航"){
        this.setNavigateHook();
      }
      else{
        this.unSetNavigateHook();
      }
    },
    rotateCamera: function(event){
      this.$root.viewer.camera.setView({orientation: {
        heading : this.Cesium.Math.toRadians(event.webkitCompassHeading),
        pitch: this.Cesium.Math.toRadians(-45)
    }});
    },
    setNavigateHook: function(){
      //调用陀螺仪
      window.addEventListener("deviceorientation",this.rotateCamera);
      document.getElementById("navi").innerHTML = "取消导航";
      this.navigate();
      this.timer = setInterval(this.navigate,10000);
    },
    unSetNavigateHook: function(){
      window.removeEventListener("deviceorientation",this.rotateCamera);
      document.getElementById("navi").innerHTML = "导航";
      clearInterval(this.timer);
      this.$root.viewer.scene.primitives.remove(this.line_primitive);
    },
    navigate: async function(){
      await this.search_sync(document.getElementById("search").value,"dest");
      var self = this;
      navigator.geolocation.getCurrentPosition(function(position){
        self.routineString["orig"] = position.coords.longitude + ',' + position.coords.latitude;
        self.reqroutine();
        },
              //error
      function(){
        alert("定位失败");
      },
      { timeout: 4000 });
      //腾讯定位API
      /*this.geolocation.getLocation(function(position){
      var wgs84_position = self.coordtransform.gcj02towgs84(position["lng"], position["lat"]);
      self.routineString["orig"] = wgs84_position[0] + ',' + wgs84_position[1];
      self.reqroutine();
      },
      //error
      function(){
        alert("定位失败");
      },
      { timeout: 4000 }
      );*/
    },
    routine: async function() {
      Promise.all([await this.search_sync(document.getElementById("orig").value, "orig"),await this.search_sync(document.getElementById("dest").value, "dest")]);
      //await this.search_sync(document.getElementById("orig").value, "orig");
      //await this.search_sync(document.getElementById("orig").value, "dest");
      this.reqroutine();
    },
      search_sync: async function(q, type) {
      var tempqueryString = {
        keyWord: "",
        level: "11",
        mapBound: "-180,-90,180,90",
        queryType: "1",
        count: "20",
        start: "0"
      };
      tempqueryString["keyWord"] = q;
      var self = this;
      await this.$http
        .get("https://api.tianditu.gov.cn/search", {
          params: {
            postStr: JSON.stringify(tempqueryString),
            type: "query",
            tk: "487eb887daf6007edad24dc0a1a62121"
          }
        })
        .then(
          response => {
            //success
            self.routineString[type] = response.body["pois"][0]["lonlat"].replace(' ',',');
          },
          //failed
          function() {
            alert("failed");
          }
        );
    },
    search: function() {
      var height = -1.337510218503426e-9;
      this.queryString["keyWord"] = document.getElementById("search").value;
      var self = this;
      //console.log(this.$root.viewer.imageryLayers.get(0).imageryProvider);
      this.queryString["level"] = "11";
      this.$http
        .get("https://api.tianditu.gov.cn/search", {
          params: {
            postStr: JSON.stringify(this.queryString),
            type: "query",
            tk: "487eb887daf6007edad24dc0a1a62121"
          }
        })
        .then(
          response => {
            //success
            var spot = response.body["pois"][0];
              if (self.marker) {
                this.$root.viewer.scene.primitives.remove(self.marker);
              }
              var lnglat = spot["lonlat"].split(" ").map(function(item) {
                return parseFloat(item);
              });
              this.$root.viewer.camera.flyTo({
                destination: this.Cesium.Cartesian3.fromDegrees(
                  lnglat[0],
                  lnglat[1] - 0.01,
                  height + 1000
                ),
                duration: 2,
                orientation: {
                  heading: this.Cesium.Math.toRadians(0),
                  pitch: this.Cesium.Math.toRadians(-45),
                  roll: 0.0
                }
              });
              var billboardCollection = new this.Cesium.BillboardCollection();
              var txt = billboardCollection.add({
                position: new this.Cesium.Cartesian3.fromDegrees(
                  lnglat[0],
                  lnglat[1],
                  100
                )
              });
              var pos_img = billboardCollection.add({
                position: new this.Cesium.Cartesian3.fromDegrees(
                  lnglat[0],
                  lnglat[1],
                  50
                )
              });
              //var image = new Image();
              //image.src = "./Assets/Images/pos_marker.png";
              //billboard.setImage("mark",this.mark(image, spot["name"], 50, 100));
              txt.image = this.mark(spot["name"], 25);
              pos_img.image = "./Assets/Images/pos_marker.png";
              self.marker = this.$root.viewer.scene.primitives.add(
                billboardCollection
              );
          },
          //failed
          function() {
            alert("failed");
          }
        );
    }
  }
};
</script>

<style>
/*Support Mobile*/
#layout {
  position: absolute;
  left: 2%;
  top: 2%;
  opacity: 0.9;
}
#search_group {
  width: 20%;
}
body {
  margin: 0px;
}
.collapse {
  width: 20%;
}
.collapsing {
  width: 20%;
}

@media screen and (max-width: 900px){
#layout {
  position: absolute;
  left: 2%;
  top: 2%;
  opacity: 0.9;
}
#search_group {
  width: 80%;
}
body {
  margin: 0px;
}
.collapse {
  width: 80%;
}
.collapsing {
  width: 80%;
}
}
</style>
