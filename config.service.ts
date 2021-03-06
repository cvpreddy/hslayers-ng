import BaseLayer from 'ol/layer/Base';
import View from 'ol/View';

export class HsConfig {
  cesiumTime: any;
  componentsEnabled: any;
  mapInteractionsEnabled: boolean;
  allowAddExternalDatasets: boolean;
  sidebarClosed: boolean;
  sidebarPosition: string;
  layer_order: string;
  box_layers: Array<any>;
  senslog: any;
  cesiumdDebugShowFramesPerSecond: boolean;
  cesiumShadows: number;
  cesiumBase: string;
  createWorldTerrainOptions: any;
  terrain_provider: any;
  cesiumTimeline: boolean;
  cesiumAnimation: boolean;
  creditContainer: any;
  cesiumInfoBox: any;
  imageryProvider: any;
  terrainExaggeration: number;
  cesiumBingKey: string;
  newTerrainProviderOptions: any;
  terrain_providers: any;
  cesiumAccessToken: string;
  proxyPrefix: string;
  defaultDrawLayerPath: string;
  default_layers: Array<BaseLayer>;
  default_view: View;
  panelsEnabled: boolean;
  advancedForm?: boolean;
  project_name?: string;
  hostname?: any;
  status_manager_url: string;
  dsPaging: number;
  permalinkLocation: any;
  social_hashtag: any;
  useProxy: boolean;
  shortenUrl: any;
  search_provider: any;
  geonamesUser: any;
  searchProvider: any;
  constructor() {}
}
