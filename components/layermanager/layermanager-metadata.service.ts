import { WMSCapabilities, WMTSCapabilities } from 'ol/format';
import { Injectable } from '@angular/core';
import { HsUtilsService, HsLayerUtilsService } from '../utils/utils.service';

@Injectable({
  providedIn: 'any',
})
export class HsLayerManagerMetadataService {
  constructor(
    private HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    private HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    private HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private HsLayerUtilsService: HsLayerUtilsService
  ) {

  }

  /**
   * @function identifyLayerObject
   * @memberOf HsLayermanagerMetadata.service
   * @param layerName
   * @param currentLayer
   * @param {Ol.layer} layer Selected layer
   * @description Recursive callback which identifies object representing added layer in WMS getCapabilities structure.
   * It is used as reference for sublayer structure, metadata
   */
  identifyLayerObject(layerName, currentLayer) {
    if (layerName == currentLayer.Name) {
      return currentLayer;
    } else {
      for (const index in currentLayer.Layer) {
        const node = currentLayer.Layer[index];
        if (node.Name == layerName) {
          return node;
        } else {
          const result = this.identifyLayerObject(layerName, node);
          if (result) {
            return result;
          }
        }
      }
      return false;
    }
  };

  /**
   * @function fillMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @param {Ol.layer} layer Selected layer
   * @description Async adds hasSublayers parameter if true
   */
  async fillMetadata(layer) {
    await this.queryMetadata(layer);
    const subLayers = layer.get('Layer');
    if (subLayers != undefined && subLayers.length > 0) {
      if (!layer.hasSublayers) {
          layer.hasSublayers = true;
          //ADD config values       
      }
    }
  };
  /**
   * @function queryMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @param {Ol.layer} layer Selected layer
   * @description Callback function, adds getCapabilities response metadata to layer object
   */
  async queryMetadata(layer) {
    const url = this.HsLayerUtilsService.getURL(layer);
    const metadata = {
      metainfo: { 'OnlineResource': layer.get('Metadata') },
    };
    //WMS
    if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const capabilities = this.HsWmsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMSCapabilities();
          const caps = parser.read(capabilities_xml);
          let layer_name = layer.getSource().getParams().LAYERS;
          const layerObject = []; //array of layer objects representing added layer

          if (layer_name.includes(',')) {
            const layers = [];
            const legends = [];

            layer_name = layer_name.split(',');
            //loop over layers from layer.LAYERS
            for (let i = 0; i < layer_name.length; i++) {
              layerObject[i] = this.identifyLayerObject(
                layer_name[i],
                caps.Capability.Layer
              );
              if (layerObject[i].Style) {
                legends.push(
                  layerObject[i].Style[0].LegendURL[0].OnlineResource
                );
              }
              if (layerObject[i].Layer != undefined) {
                //loop over sublayers of layer from layer.LAYERS
                for (let j = 0; j < layerObject[i].Layer.length; j++) {
                  layers.push(layerObject[i].Layer[j]); //merge sublayers
                }
              }
            }
            layer.setProperties(layerObject[0]);
            layer.set('Layer', layers);
            layer.set('Legends', legends);
            layer.set('MetadataURL', {
              //use service metadata for layers with multiple layer.LAYERS inputs
              '0': caps.Service,
            });
          } else {
            layerObject[0] = this.identifyLayerObject(
              layer_name,
              caps.Capability.Layer
            );
            layer.setProperties(layerObject[0]);
            if (layerObject[0].Style) {
              layer.set(
                'Legends',
                layerObject[0].Style[0].LegendURL[0].OnlineResource
              );
            }
          }

          //prioritize config values
          if (layer.get('Copyright')) {
            layer.set('Attribution', {
              'OnlineResource': layer.get('Copyright'),
            });
          }
          if (layer.get('Metadata')) {
            layer.set('MetadataURL', metadata);
            return layer;
          }
          if (layerObject[0].MetadataURL == undefined) {
            layer.set('MetadataURL', {
              '0': caps.Service,
            });
          }

          return true;
        })
        .catch((e) => {
          console.log('GetCapabilities call invalid', e);
          return e;
        });
      return capabilities;
    }
    //WMTS
    else if (this.HsLayerUtilsService.isLayerWMTS(layer)) {
      const capabilities = this.HsWmtsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMTSCapabilities();
          const caps = parser.read(capabilities_xml.data);
          layer.setProperties(caps);
          if (layer.get('Copyright')) {
            layer.set('Attribution', {
              'OnlineResource': layer.get('Copyright'),
            });
          } else {
            layer.set('Attribution', {
              'OnlineResource': caps.ServiceProvider.ProviderSite,
            });
          }
          if (layer.get('Metadata')) {
            layer.set('MetadataURL', metadata);
          }
          return true;
        })
        .catch((error) => {
          return error;
        });
      return capabilities;
    }
    //WFS and vector
    else if (this.HsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (url) {
        const capabilities = this.HsWfsGetCapabilitiesService.requestGetCapabilities(
          url
        )
          .then((capabilities_xml) => {
            const parser = new DOMParser();
            const caps = parser.parseFromString(
              capabilities_xml.data,
              'application/xml'
            );
            const el = caps.getElementsByTagNameNS('*', 'ProviderSite');
            if (layer.get('Copyright')) {
              layer.set('Attribution', {
                'OnlineResource': layer.get('Copyright'),
              });
            } else {
              layer.set('Attribution', {
                'OnlineResource': el[0].getAttribute('xlink:href'),
              });
            }
            return true;
          })
          .catch((error) => {
            return error;
          });
        return capabilities;
      }
    }
  };

}
