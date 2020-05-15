'use strict';

import './components/add-layers/add-layers.module';
import './components/datasource-selector/datasource-selector.module';
import './components/draw/draw.module';
import './components/info/info.module';
import './components/measure/measure.module';
import './components/permalink/permalink.module';
import './components/print/print.module';
import './components/query/query.module';
import './components/search/search.module';
import './components/sidebar/sidebar.module';
import './components/styles/styles.module';
import './components/toolbar/toolbar.module';

const mainModuleBs = angular.module('hs', [
  'hs.sidebar',
  'hs.toolbar',
  'hs.layermanager',
  'hs.draw',
  'hs.map',
  'hs.query',
  'hs.search',
  'hs.print',
  'hs.permalink',
  'hs.measure',
  'hs.legend',
  'hs.geolocation',
  'hs.core',
  'hs.datasource_selector',
  'hs.save-map',
  'hs.addLayers',
  'gettext',
  'hs.compositions',
  'hs.info',
  'hs.styles',
]);

mainModuleBs.directive('hs', [
  'HsConfig',
  'HsCore',
  function (config, HsCore) {
    return {
      template: require('hslayers.html'),
      link: function (scope, element, attrs) {
        if (
          typeof config.sizeMode == 'undefined' ||
          config.sizeMode == 'fullscreen'
        ) {
          HsCore.fullScreenMap(element);
        }
      },
    };
  },
]);

import * as proj from 'ol/proj';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {GeometryType, LineString, Point, Polygon} from 'ol/geom';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';
import {register} from 'ol/proj/proj4';

window.ol = {
  layer: {
    Tile,
    Group,
    Image: ImageLayer,
    Vector: VectorLayer,
  },
  source: {
    OSM,
    XYZ,
    TileWMS,
    Vector,
    WMTS,
    TileArcGISRest,
    BingMaps,
    ImageWMS,
    ImageArcGISRest,
  },
  format: {
    GeoJSON,
  },
  View,
  proj,
};

if (window.hslayersNgConfig) {
  mainModuleBs.value('HsConfig', window.hslayersNgConfig(window.ol));
}

mainModuleBs.controller('Main', [
  '$scope',
  'HsCore',
  'HsConfig',
  'HsMapService',
  function ($scope, HsCore, config, hsMap) {
    $scope.HsCore = HsCore;
    let lastConfigBuster = config.buster;
    setInterval(() => {
      if (lastConfigBuster != config.buster) {
        lastConfigBuster = config.buster;
        hsMap.reset();
      }
    }, 100);
  },
]);
