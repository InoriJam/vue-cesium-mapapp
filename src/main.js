// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Cesium from 'cesium/Cesium'
import widgets from 'cesium/Widgets/widgets.css'
import VueResource from 'vue-resource'
import $ from 'jquery'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../node_modules/bootstrap/dist/js/bootstrap.min.js'
//import './js/geolocation.min.js'
//import coordtransform from 'coordtransform'

Vue.use(VueResource);
Vue.config.productionTip = false

Vue.prototype.Cesium = Cesium;
/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    components: { App },
    template: '<App/>',
    data: {
        viewer: null
    },
    mounted() {
        this.viewer = new Cesium.Viewer('cesiumContainer', {
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            scene3DOnly: true,
            imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
                url: "https://{s}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=487eb887daf6007edad24dc0a1a62121",
                maximumLevel: 17,
                style: "default",
                format: "image/jpeg",
                layer: "tdtVecBasicLayer",
                tileMatrixSetID: "c",
                subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
                tilingScheme: new Cesium.GeographicTilingScheme(),
                tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
                show: false
            })
        });
        this.viewer._cesiumWidget._creditContainer.style.display = "none";
        this.viewer.imageryLayers.addImageryProvider(new Cesium.WebMapTileServiceImageryProvider({
            url: "https://{s}.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=487eb887daf6007edad24dc0a1a62121",
            maximumLevel: 17,
            style: "default",
            format: "image/jpeg",
            layer: "tdtAnnoLayer",
            tileMatrixSetID: "c",
            subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
            tilingScheme: new Cesium.GeographicTilingScheme(),
            tileMatrixLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'],
            show: false
        }));
        this.add3dtiles('./Assets/data/tileset.json');
        //初始化定位模块
        //var geolocation = new qq.maps.Geolocation('36WBZ-AXGKQ-4U556-G2LPW-5F423-PIBHF', '毕业设计-Web');
        //Vue.prototype.geolocation = geolocation;
        //Vue.prototype.coordtransform = coordtransform;
        var self = this;
        navigator.geolocation.getCurrentPosition(function(position) {
                //移动视角到定位位置
                var height = -1.337510218503426e-9;

                self.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(position.coords.longitude, position.coords.latitude - 0.01, height + 1000),
                    duration: 2,
                    orientation: {
                        heading: Cesium.Math.toRadians(0),
                        pitch: Cesium.Math.toRadians(-45),
                        roll: 0.0
                    }
                });

                //添加定位标注
                var billboardCollection = new Cesium.BillboardCollection();
                var pos_img = billboardCollection.add({
                    position: new Cesium.Cartesian3.fromDegrees(
                        position.coords.longitude,
                        position.coords.latitude,
                        50
                    )
                });
                pos_img.image = "./Assets/Images/pos_marker.png";
                self.marker = self.viewer.scene.primitives.add(
                    billboardCollection
                );
            },
            //error
            function() {
                alert("定位失败");
                var longitude = 104.07514767850013;
                var latitude = 30.646539430866287;
                var height = -1.337510218503426e-9;

                self.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000),
                    duration: 2,
                    orientation: {
                        heading: Cesium.Math.toRadians(175.0),
                        pitch: Cesium.Math.toRadians(-35.0),
                        roll: 0.0
                    }
                });
            }, { timeout: 4000 }
        );
        //腾讯定位
        /*geolocation.getLocation(function(position) {

                //移动视角到定位位置
                var wgs84_position = coordtransform.gcj02towgs84(position["lng"], position["lat"]);
                var height = -1.337510218503426e-9;

                self.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(wgs84_position[0], wgs84_position[1] - 0.01, height + 1000),
                    duration: 2,
                    orientation: {
                        heading: Cesium.Math.toRadians(0),
                        pitch: Cesium.Math.toRadians(-45),
                        roll: 0.0
                    }
                });

                //添加定位标注
                var billboardCollection = new Cesium.BillboardCollection();
                var pos_img = billboardCollection.add({
                    position: new Cesium.Cartesian3.fromDegrees(
                        wgs84_position[0],
                        wgs84_position[1],
                        50
                    )
                });
                pos_img.image = "./Assets/Images/pos_marker.png";
                self.marker = self.viewer.scene.primitives.add(
                    billboardCollection
                );

            },
            function() {
                alert("定位失败");
                var longitude = 104.07514767850013;
                var latitude = 30.646539430866287;
                var height = -1.337510218503426e-9;

                self.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000),
                    duration: 2,
                    orientation: {
                        heading: Cesium.Math.toRadians(175.0),
                        pitch: Cesium.Math.toRadians(-35.0),
                        roll: 0.0
                    }
                });
            }, { timeout: 4000 }
        );*/
    },
    methods: {
        add3dtiles: function(tile_url) {
            var tileset = new Cesium.Cesium3DTileset({
                url: tile_url,
                maximumScreenSpaceError: 64
            });

            this.viewer.scene.primitives.add(tileset);

        }
    }
});