import Feature from 'ol/Feature';
import Map from 'ol/Map';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLaymanService} from './layman.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';

@Injectable({
  providedIn: 'root',
})
export class HsLayerSynchronizerService {
  debounceInterval = 1000;
  crs: any;
  syncedLayers: Layer[] = [];
  constructor(
    private HsUtilsService: HsUtilsService,
    private HsLaymanService: HsLaymanService,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsDialogContainerService: HsDialogContainerService
  ) {}

  init(map: Map): void {
    const layerAdded = (e) => this.addLayer(e.element);
    map.getLayers().on('add', layerAdded);
    map.getLayers().on('remove', (e) => {
      this.removeLayer(e.element);
    });
    map.getLayers().forEach((lyr) => {
      layerAdded({
        element: lyr,
      });
    });
    this.crs = map.getView().getProjection().getCode();
    this.HsLaymanService.crs = this.crs;
  }

  /**
   * Start synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function addLayer
   * @param {object} layer Layer to add
   */
  addLayer(layer: Layer): void {
    const synchronizable = this.startMonitoring(layer);
    if (synchronizable) {
      this.syncedLayers.push(layer);
    }
  }

  /**
   * Keep track of synchronized vector layers by listening to
   * VectorSources change events. Initialy also get features from server
   *
   * @memberof HsLayerSynchronizerService
   * @function startMonitoring
   * @param {object} layer Layer to add
   * @returns {boolean} If layer is synchronizable
   */
  startMonitoring(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer.getSource(), VectorSource) &&
      layer.get('synchronize') === true
    ) {
      const layerSource = layer.getSource();
      this.pull(layer, layerSource);
      return true;
    }
  }

  /**
   * Get features from Layman endpoint as WFS string, parse and add
   * them to Openlayers VectorSource
   *
   * @memberof HsLayerSynchronizerService
   * @function pull
   * @param {Ol.layer} layer Layer to get Layman friendly name for
   * @param {Ol.source} source Openlayers VectorSource to store features in
   */
  pull(layer: Layer, source: Source): void {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.HsLaymanService.pullVectorSource(
          ds,
          this.getLayerName(layer)
        ).then((response: string) => {
          let featureString;
          if (response) {
            featureString = response;
          }
          layer.set('hs-layman-synchronizing', false);
          if (featureString) {
            source.loading = true;
            const format = new WFS();
            featureString = featureString.replace(
              '/urn:x-ogc:def:crs:EPSG:3857/gm',
              'EPSG:3857'
            );
            source.addFeatures(format.readFeatures(featureString));
            source.loading = false;
          }

          source.forEachFeature((f) => this.observeFeature(f));
          source.on('addfeature', (e) => {
            this.sync([e.feature], [], [], layer);
          });
          source.on('removefeature', (e) => {
            this.sync([], [], [e.feature], layer);
          });
        });
      });
  }

  /**
   * @param f
   */
  observeFeature(f): void {
    f.getGeometry().on(
      'change',
      this.HsUtilsService.debounce(
        (geom) => {
          this.handleFeatureChange(f);
        },
        this.debounceInterval,
        false,
        this
      )
    );
    f.on('propertychange', this.handleFeatureChange);
  }

  /**
   * @param e
   */
  handleFeatureChange(e): void {
    this.sync([], [e.target || e], [], e.target.getLayer());
  }

  /**
   * @param inserted
   * @param updated
   * @param deleted
   * @param layer
   */
  sync(
    inserted: Feature[],
    updated: Feature[],
    deleted: Feature[],
    layer: Layer
  ): void {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.HsLaymanService.createWfsTransaction(
          ds,
          inserted,
          updated,
          deleted,
          this.getLayerName(layer),
          layer
        ).then((response: string) => {
          if (response.indexOf('Exception') > -1) {
            this.displaySyncErrorDialog(response);
          }
          layer.set('hs-layman-synchronizing', false);
        });
      });
  }

  displaySyncErrorDialog(error: string): void {
    this.HsDialogContainerService.create(HsSyncErrorDialogComponent, {
      exception: error,
    });
  }

  /**
   * Get Layman friendly name for layer based on its title by
   * removing spaces, converting to lowercase
   *
   * @memberof HsLayerSynchronizerService
   * @function getLayerName
   * @param {Ol.layer} layer Layer to get Layman friendly name for
   * @returns {string} Layer title
   */
  getLayerName(layer: Layer): string {
    return layer.get('title').toLowerCase().replace('/ /gm', '');
  }

  /**
   * Stop synchronizing layer to database
   *
   * @memberof HsLayerSynchronizerService
   * @function removeLayer
   * @param {Ol.layer} layer Layer to remove from legend
   */
  removeLayer(layer: Layer): void {
    for (let i = 0; i < this.syncedLayers.length; i++) {
      if (this.syncedLayers[i] == layer) {
        this.syncedLayers.splice(i, 1);
        break;
      }
    }
  }
}
