import * as extent from 'ol/extent';
import {Select} from 'ol/interaction';
import {WKT} from 'ol/format';
import {altKeyOnly, click, pointerMove} from 'ol/events/condition.js';
import {toLonLat} from 'ol/proj.js';

export default [
  '$rootScope',
  'hs.query.baseService',
  '$sce',
  'hs.map.service',
  'config',
  'hs.utils.service',
  'hs.utils.layerUtilsService',
  '$window',
  'hs.layermanager.service',
  function ($rootScope, Base, $sce, OlMap, Config, utils, layerUtils, $window, LayMan) {
    const me = this;

    this.getHighlightedStyle = function(layer){
      if (layer == null) {
        return;
      }
      if (layer.get('highlightedStyle')) {
        return layer.get('highlightedStyle');
      }
    };

    this.highlightFeature = function(feature) {
      me.highlightedStyle = this.getHighlightedStyle(LayMan.currentLayer.layer);
      if(me.highlightedStyle){
        feature.setStyle(me.highlightedStyle);
        feature.setProperties({
            class: "highlighted"
        });
      };
    };

    this.unhighlightFeature = function(feature){
      feature.setProperties({
          class: ""
      });
      feature.setStyle(null);
    }

    this.highlighter = new Select({
      condition: pointerMove,
    });

    this.selector = new Select({
      condition: click,
      style: function (feature, layer) {
        return this.getHighlightedStyle(layer);
      },
      /*multi:
        angular.isDefined(Config.query) && Config.query.multi
          ? Config.query.multi
          : false,*/
      filter: function (feature, layer) {
        if (layer === null) {
          return;
        }
        if (layer.get('queryable') === false) {
          return false;
        } else {
          return true;
        }
      },
    });
    $rootScope.$broadcast('vectorSelectorCreated', me.selector);

    $rootScope.$on('map.loaded', (e) => {
      OlMap.map.addInteraction(me.selector);
      OlMap.map.addInteraction(me.highlighter);
    });

    $rootScope.$on('queryStatusChanged', () => {
      /*if (Base.queryActive) OlMap.map.addInteraction(me.selector);
            else OlMap.map.removeInteraction(me.selector);*/
    });

    $rootScope.$on('vectorQuery.featureSelected', (e, feature) => {
      this.highlightFeature(feature);
    });

    $rootScope.$on('vectorQuery.featureDelected', (e, feature) => {
      this.unhighlightFeature(feature);
    });

    me.selector.getFeatures().on('add', (e) => {
      $rootScope.$broadcast(
        'vectorQuery.featureSelected',
        e.element,
        me.selector
      );
      //deprecated
      $rootScope.$broadcast(
        'infopanel.feature_selected',
        e.element,
        me.selector
      );
    });

    me.selector.getFeatures().on('remove', (e) => {
      $rootScope.$broadcast('vectorQuery.featureDelected', e.element);
      //deprecated
      $rootScope.$broadcast('infopanel.feature_deselected', e.element);
    });

    me.highlighter.on('select', function(e) {
        if (e.selected.length > 0) me.highlightFeature(e.selected[0], true);
        if (e.deselected.length > 0) me.unhighlightFeature(e.deselected[0], e.selected.length === 0);
    });

    $rootScope.$on('mapQueryStarted', (e) => {
      Base.clearData('features');
      if (!Base.queryActive) {
        return;
      }
      me.createFeatureAttributeList();
    });
    me.createFeatureAttributeList = () => {
      Base.data.attributes.length = 0;
      const features = me.selector.getFeatures().getArray();
      let featureDescriptions = [];
      angular.forEach(features, (feature) => {
        featureDescriptions = featureDescriptions.concat(
          getFeatureAttributes(feature)
        );
      });
      Base.setData(featureDescriptions, 'features');
      $rootScope.$broadcast('queryVectorResult');
    };
    me.exportData = (clickedFormat, feature) => {
      if (clickedFormat == 'WKT format') {
        const formatWKT = new WKT();
        const wktRepresentation = formatWKT.writeFeature(feature);
        const data = new Blob([wktRepresentation], {type: 'text/plain'});
        const url = $window.URL.createObjectURL(data);
        if (me.exportedFeatureHref) {
          $window.URL.revokeObjectURL(me.exportedFeatureHref);
        }
        me.exportedFeatureHref = url;
      } else {
        return;
      }
    };

    function getFeatureLayerName(feature) {
      if (angular.isUndefined(feature.getLayer)) {
        return '';
      }
      const layer = feature.getLayer(OlMap.map);
      return layerUtils.getLayerName(layer);
    }

    function getCentroid(feature) {
      if (angular.isUndefined(feature)) {
        return;
      }
      const center = extent.getCenter(feature.getGeometry().getExtent());
      return center;
    }
    /**
     * @function getFeatureAttributes
     * @memberOf hs.query.controller
     * @params {Object} feature Selected feature from map
     * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
     */
    function getFeatureAttributes(feature) {
      const attributes = [];
      let tmp = [];
      let hstemplate = null;
      let customInfoTemplate = null;
      feature.getKeys().forEach((key) => {
        if (['gid', 'geometry', 'wkb_geometry'].indexOf(key) > -1) {
          return;
        }
        if (feature.get('hstemplate')) {
          hstemplate = feature.get('hstemplate');
        }
        if (key == 'features') {
          for (const ixSubFeature in feature.get('features')) {
            const subFeature = feature.get('features')[ixSubFeature];
            tmp = tmp.concat(getFeatureAttributes(subFeature));
          }
        } else {
          let obj;
          if ((typeof feature.get(key)).toLowerCase() == 'string') {
            obj = {
              name: key,
              value: $sce.trustAsHtml(feature.get(key)),
            };
          } else {
            obj = {
              name: key,
              value: feature.get(key),
            };
          }
          attributes.push(obj);
        }
      });
      if (feature.getLayer && feature.getLayer(OlMap.map).get('customInfoTemplate')) {
        customInfoTemplate = feature
          .getLayer(OlMap.map)
          .get('customInfoTemplate');
      }

      const featureDescription = {
        layer: getFeatureLayerName(feature),
        name: 'Feature',
        attributes: attributes,
        stats: [{name: 'center', value: toLonLat(getCentroid(feature))}],
        hstemplate,
        feature,
        customInfoTemplate: $sce.trustAsHtml(customInfoTemplate),
      };
      tmp.push(featureDescription);
      return tmp;
    }
  },
];
