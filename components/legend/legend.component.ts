import { Component } from '@angular/core';
import { HsLegendService } from './legend.service';
import { HsMapService } from '../map/map.service.js';
@Component({
  selector: 'hs.legend',
  template: require('./partials/legend.html')
})
export class HsLegendComponent {
  layerDescriptors = [];

  constructor(private HsLegendService: HsLegendService, private HsMapService: HsMapService) {
    this.HsMapService.loaded().then((map) => this.init(map));
    //this.$emit('scope_loaded', 'Legend');
  }

  /**
   * Add selected layer to the list of layers in legend (with event listener
   * to display/hide legend item when layer visibility change)
   *
   * @memberof hs.legend.controller
   * @function addLayerToLegends
   * @param {object} layer Layer to add legend for
   */
  addLayerToLegends(layer) {
    const descriptor = this.HsLegendService.getLayerLegendDescriptor(layer);
    if (descriptor) {
      this.layerDescriptors.push(descriptor);
      layer.on('change:visible', this.layerVisibilityChanged);
      layer.getSource().on('change', (e) => this.layerSourcePropChanged(e));
    }
  }

  filterDescriptors(): any[] {
    return this.layerDescriptors;
  }

  /**
   * Check if there is any visible layer
   *
   * @memberof hs.legend.controller
   * @returns {boolean} Returns true if no layers with legend exist
   * @function noLayerExists
   */
  noLayerExists() {
    const visibleLayers = this.layerDescriptors.filter(
      (check) => check.visible
    );
    return visibleLayers.length == 0;
  }

  /**
   * Remove selected layer from legend items
   *
   * @memberof hs.legend.controller
   * @function removeLayerFromLegends
   * @param {Ol.layer} layer Layer to remove from legend
   */
  removeLayerFromLegends(layer) {
    for (let i = 0; i < this.layerDescriptors.length; i++) {
      if (this.layerDescriptors[i].lyr == layer) {
        this.layerDescriptors.splice(i, 1);
        break;
      }
    }
  }

  /**
   *
   */
  init(map) {
    map.getLayers().on('add', (e) => this.layerAdded(e));
    map.getLayers().on('remove', (e) => {
      this.removeLayerFromLegends(e.element);
    });
    map.getLayers().forEach((lyr) => {
      this.layerAdded({
        element: lyr,
      });
    });
  }

  /**
   * (PRIVATE) Callback function for adding layer to map, add layers legend
   *
   * @memberof hs.legend.controller
   * @function layerAdded
   * @param {object} e Event object, should have element property
   */
  layerAdded(e) {
    this.addLayerToLegends(e.element);
  }

  /**
   * @param e event description
   */
  layerVisibilityChanged(e) {
    const descriptor = this.findLayerDescriptor(e.target);
    if (descriptor) {
      descriptor.visible = e.target.getVisible();
    }
  }

  /**
   * @param e event description
   */
  layerSourcePropChanged(e) {
    const descriptor = this.findLayerDescriptorBySource(e.target);
    if (descriptor) {
      const newDescriptor = this.HsLegendService.getLayerLegendDescriptor(
        descriptor.lyr
      );

      if (
        newDescriptor.subLayerLegends != descriptor.subLayerLegends ||
        newDescriptor.title != descriptor.title
      ) {
        this.layerDescriptors[
          this.layerDescriptors.indexOf(descriptor)
        ] = newDescriptor;
      }
    }
  }

  /**
   * Finds layer descriptor for openlayers layer
   *
   * @returns {object} Object describing the legend
   * @param {ol/layer} layer OpenLayers layer
   */
  findLayerDescriptor(layer) {
    const found = this.layerDescriptors.filter((ld) => ld.lyr == layer);
    if (found.length > 0) {
      return found[0];
    }
  }

  /**
   * @param source
   */
  findLayerDescriptorBySource(source) {
    const found = this.layerDescriptors.filter(
      (ld) => ld.lyr.getSource() == source
    );
    if (found.length > 0) {
      return found[0];
    }
  }

}