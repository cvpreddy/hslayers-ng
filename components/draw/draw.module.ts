import '../core/';
import '../geolocation/geolocation.module';
import '../map/map.module';
import '../utils/utils.module';
import * as angular from "angular";
import drawController from './draw.controller';
import drawDirective from './draw.directive';
import drawLayerMetadataComponent from './draw-layer-metadata.component';
import {HsDrawService} from './draw.service';
import drawShapeToolbarComponent from './draw-shape-toolbar.component';

/**
 * @namespace hs.draw
 * @memberOf hs
 */

angular
  .module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
  .service('HsDrawService', HsDrawService)

  /**
   * @memberof hs.draw
   * @ngdoc component
   * @name hs.draw.shapeToolbar
   * @description Buttons in the corner for controlling drawing
   */
  .component('hs.draw.shapeToolbar', drawShapeToolbarComponent)
  .component('hs.drawLayerMetadata', drawLayerMetadataComponent)
  .controller('HsDrawController', drawController)
  .directive('hs.draw.directive', drawDirective);
