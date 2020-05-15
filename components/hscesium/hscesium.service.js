import 'permalink.module';
import HsCsCamera from 'hs_cesium_camera';
import HsCsLayers from 'hs_cesium_layers';
import HsCsTime from 'hs_cesium_time';
import {transformExtent} from 'ol/proj';

export default [
  'HsConfig',
  '$rootScope',
  'HsUtilsService',
  'HsMapService',
  'HsLayermanagerService',
  'HsLayoutService',
  function (
    config,
    $rootScope,
    utils,
    hs_map,
    layer_manager_service,
    layoutService
  ) {
    const me = this;
    let viewer;
    const BING_KEY = angular.isDefined(config.cesiumBingKey)
      ? config.cesiumBingKey
      : 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';

    /**
     * @ngdoc method
     * @name HsCesiumService#init
     * @public
     * @description Initializes Cesium map
     */
    this.init = function () {
      Cesium.Ion.defaultAccessToken =
        config.cesiumAccessToken ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
      window.CESIUM_BASE_URL = config.cesiumBase;
      let terrain_provider =
        config.terrain_provider ||
        Cesium.createWorldTerrain(config.createWorldTerrainOptions);
      if (config.newTerrainProviderOptions) {
        terrain_provider = new Cesium.CesiumTerrainProvider(
          config.newTerrainProviderOptions
        );
      }

      const view = hs_map.map.getView();
      const ol_ext = view.calculateExtent(hs_map.map.getSize());
      const trans_ext = transformExtent(
        ol_ext,
        view.getProjection(),
        'EPSG:4326'
      );
      const rectangle = Cesium.Rectangle.fromDegrees(
        trans_ext[0],
        trans_ext[1],
        trans_ext[2],
        trans_ext[3]
      );

      Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
      Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;
      Cesium.BingMapsApi.defaultKey = BING_KEY;

      //TODO: research if this must be used or ignored
      const bing = new Cesium.BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        key: Cesium.BingMapsApi.defaultKey,
        mapStyle: Cesium.BingMapsStyle.AERIAL,
      });
      viewer = new Cesium.Viewer(
        layoutService.contentWrapper.querySelector('.hs-cesium-container'),
        {
          timeline: angular.isDefined(config.cesiumTimeline)
            ? config.cesiumTimeline
            : false,
          animation: angular.isDefined(config.cesiumAnimation)
            ? config.cesiumAnimation
            : false,
          creditContainer: angular.isDefined(config.creditContainer)
            ? config.creditContainer
            : undefined,
          infoBox: angular.isDefined(config.cesiumInfoBox)
            ? config.cesiumInfoBox
            : true,
          terrainProvider: terrain_provider,
          imageryProvider: config.imageryProvider,
          terrainExaggeration: config.terrainExaggeration || 1.0,
          // Use high-res stars downloaded from https://github.com/AnalyticalGraphicsInc/cesium-assets
          skyBox: new Cesium.SkyBox({
            sources: {
              positiveX:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
              negativeX:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
              positiveY:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
              negativeY:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
              positiveZ:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
              negativeZ:
                (config.cesiumBase || 'node_modules/cesium/Build/Cesium/') +
                'Assets/Textures/SkyBox/tycho2t3_80_mz.jpg',
            },
          }),
          // Show Columbus View map with Web Mercator projection
          sceneMode: Cesium.SceneMode.SCENE3D,
          mapProjection: new Cesium.WebMercatorProjection(),
          shadows: config.cesiumShadows || false,
          scene3DOnly: true,
          sceneModePicker: false,
        }
      );

      viewer.scene.debugShowFramesPerSecond = angular.isDefined(
        config.cesiumdDebugShowFramesPerSecond
      )
        ? config.cesiumdDebugShowFramesPerSecond
        : false;
      viewer.scene.globe.enableLighting = config.cesiumShadows || false;
      viewer.scene.globe.shadows = config.cesiumShadows || false;

      viewer.terrainProvider = terrain_provider;

      if (angular.isDefined(config.cesiumTime)) {
        viewer.clockViewModel.currentTime = config.cesiumTime;
      }

      me.viewer = viewer;
      HsCsCamera.init(viewer, hs_map);
      HsCsTime.init(viewer, hs_map, me, $rootScope, HsCsLayers);
      HsCsLayers.init(viewer, hs_map, me, $rootScope, config, utils);

      me.HsCsCamera = HsCsCamera;
      me.HsCsTime = HsCsTime;
      me.HsCsLayers = HsCsLayers;

      window.addEventListener('blur', () => {
        if (viewer.isDestroyed()) {
          return;
        }
        me.viewer.targetFrameRate = 5;
      });

      window.addEventListener('focus', () => {
        if (viewer.isDestroyed()) {
          return;
        }
        me.viewer.targetFrameRate = 30;
      });

      viewer.camera.moveEnd.addEventListener((e) => {
        if (!hs_map.visible) {
          const center = HsCsCamera.getCameraCenterInLngLat();
          if (center == null) {
            return;
          } //Not looking on the map but in the sky
          const viewport = HsCsCamera.getViewportPolygon();
          $rootScope.$broadcast('map.sync_center', center, viewport);
        }
      });

      layer_manager_service.data.terrainlayers = [];
      angular.forEach(config.terrain_providers, (provider) => {
        provider.type = 'terrain';
        layer_manager_service.data.terrainlayers.push(provider);
      });

      $rootScope.$on('map.extent_changed', (event, data, b) => {
        const view = hs_map.map.getView();
        if (hs_map.visible) {
          HsCsCamera.setExtentEqualToOlExtent(view);
        }
      });

      $rootScope.$on('search.zoom_to_center', (event, data) => {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            data.coordinate[0],
            data.coordinate[1],
            15000.0
          ),
        });
      });

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const pickRay = viewer.camera.getPickRay(movement.position);
        const pickedObject = viewer.scene.pick(movement.position);
        const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(
          pickRay,
          viewer.scene
        );
        if (pickedObject && pickedObject.id && pickedObject.id.onclick) {
          pickedObject.id.onclick(pickedObject.id);
          return;
        }
        if (!Cesium.defined(featuresPromise)) {
          if (console) {
            console.log('No features picked.');
          }
        } else {
          Cesium.when(featuresPromise, (features) => {
            let s = '';
            if (features.length > 0) {
              for (let i = 0; i < features.length; i++) {
                s = s + features[i].data + '\n';
              }
            }
            const iframe = document.querySelector('.cesium-infoBox-iframe');
            if (iframe) {
              setTimeout(() => {
                const innerDoc = iframe.contentDocument
                  ? iframe.contentDocument
                  : iframe.contentWindow.document;
                innerDoc.querySelector(
                  '.cesium-infoBox-description'
                ).innerHTML = s.replaceAll('\n', '<br/>');
                iframe.style.height = 200 + 'px';
              }, 1000);
            }
          });
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

      handler.setInputAction((movement) => {
        const pickedObject = viewer.scene.pick(movement.position);
        if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
          pickedObject.id.onmouseup(pickedObject.id);
          return;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

      function rightClickLeftDoubleClick(movement) {
        const pickRay = viewer.camera.getPickRay(movement.position);
        const pickedObject = viewer.scene.pick(movement.position);

        if (viewer.scene.pickPositionSupported) {
          if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
            const cartesian = viewer.scene.pickPosition(movement.position);
            if (Cesium.defined(cartesian)) {
              const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
              const longitudeString = Cesium.Math.toDegrees(
                cartographic.longitude
              );
              const latitudeString = Cesium.Math.toDegrees(
                cartographic.latitude
              );
              $rootScope.$broadcast('cesium_position_clicked', [
                longitudeString,
                latitudeString,
              ]);
            }
          }
        }
        if (pickedObject && pickedObject.id && pickedObject.id.onclick) {
          pickedObject.id.onRightClick(pickedObject.id);
          return;
        }
      }

      handler.setInputAction(
        rightClickLeftDoubleClick,
        Cesium.ScreenSpaceEventType.RIGHT_DOWN
      );
      handler.setInputAction(
        rightClickLeftDoubleClick,
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );

      /**
       * @ngdoc event
       * @name HsCesiumService#map.loaded
       * @eventType broadcast on $rootScope
       * @description
       */
      $rootScope.$broadcast('cesiummap.loaded', viewer, me);
    };

    this.dimensionChanged = function (layer, dimension) {
      var layer = layer.cesium_layer;
      if (
        angular.isUndefined(layer.prm_cache) ||
        angular.isUndefined(layer.prm_cache.dimensions) ||
        angular.isUndefined(layer.prm_cache.dimensions[dimension.name])
      ) {
        return;
      }
      me.HsCsLayers.changeLayerParam(layer, dimension.name, dimension.value);
      me.HsCsLayers.removeLayersWithOldParams();
    };

    this.resize = function (event, size) {
      if (angular.isUndefined(size)) {
        return;
      }
      layoutService.contentWrapper.querySelector(
        '.hs-cesium-container'
      ).style.height = size.height + 'px';
      if (document.querySelector('.cesium-viewer-timelineContainer')) {
        document.querySelector('.cesium-viewer-timelineContainer').style.right =
          '0';
      }
      if (document.querySelector('.cesium-viewer-bottom')) {
        if (document.querySelector('.cesium-viewer-timelineContainer')) {
          document.querySelector('.cesium-viewer-bottom').style.bottom = '30px';
        } else {
          document.querySelector('.cesium-viewer-bottom').style.bottom = '0';
        }
      }

      $rootScope.$broadcast('cesiummap.resized', viewer, me);
    };

    this.getCameraCenterInLngLat = HsCsCamera.getCameraCenterInLngLat;
    this.linkOlLayerToCesiumLayer = HsCsLayers.linkOlLayerToCesiumLayer;
    this.broadcastLayerList = HsCsTime.broadcastLayerList;
    return me;
  },
];
