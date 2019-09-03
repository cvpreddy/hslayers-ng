import { Vector as VectorSource } from 'ol/source';
import { GeoJSON, WFS } from 'ol/format';
const debounceInterval = 1000;

export default ['Core', 'hs.utils.service', 'config', 'hs.map.service', 'hs.laymanService', '$timeout',
    function (Core, utils, config, hsMap, laymanService, $timeout) {
        var me = this;
        angular.extend(me, {
            syncedLayers: [],
            crs: null,

            init(map) {
                const layerAdded = (e) => me.addLayer(e.element);
                map.getLayers().on("add", layerAdded);
                map.getLayers().on("remove", function (e) {
                    me.removeLayer(e.element);
                });
                map.getLayers().forEach(lyr => {
                    layerAdded({
                        element: lyr
                    });
                });
                me.crs = map.getView().getProjection().getCode()
            },

            /**
             * Start synchronizing layer to database
             * @memberof hs.layerSynchronizerService
             * @function addLayer
             * @param {object} layer Layer to add
             */
            addLayer: function (layer) {
                var descriptor = me.getLayerDescriptor(layer);
                if (descriptor) {
                    me.syncedLayers.push(layer);
                }
            },

            /**
             * Keep track of synchronized vector layers by listening to 
             * VectorSources change events. Initialy also get features from server
             * @memberof hs.layerSynchronizerService
             * @function getLayerDescriptor
             * @param {object} layer Layer to add
             */
            getLayerDescriptor(layer) {
                if (utils.instOf(layer.getSource(), VectorSource) &&
                    layer.get('synchronize') === true) {
                    var layerSource = layer.getSource();
                    me.pull(layer, layer.getSource());
                    return layer
                }
            },

            /**
             * Send features to Layman endpoint as WFS string
             * @memberof hs.layerSynchronizerService
             * @function getLayerName
             * @param {Ol.layer} layer Layer to get Layman friendly name for
             * @param {Ol.source} source Openlayers VectorSource from which to 
             * get features
             */
            push(layer, source) {
                var f = new GeoJSON();
                var geojson = f.writeFeaturesObject(source.getFeatures());
                (config.datasources || []).filter(ds => ds.type == 'layman').forEach(
                    ds => {
                        laymanService.pushVectorSource(ds, geojson, {
                            title: layer.get('title'),
                            name: me.getLayerName(layer),
                            crs: me.crs
                        }).then(response => {
                        });
                    })
            },

            /**
             * Get features from Layman endpoint as WFS string, parse and add 
             * them to Openlayers VectorSource
             * @memberof hs.layerSynchronizerService
             * @function getLayerName
             * @param {Ol.layer} layer Layer to get Layman friendly name for
             * @param {Ol.source} source Openlayers VectorSource to store features in
             */
            pull(layer, source) {
                (config.datasources || []).filter(ds => ds.type == 'layman').forEach(
                    ds => {
                        laymanService.pullVectorSource(ds, me.getLayerName(layer))
                            .then(featureString => {
                                if (featureString) {
                                    source.loading = true;
                                    var format = new WFS();
                                    featureString = featureString.replaceAll('urn:x-ogc:def:crs:EPSG:3857', 'EPSG:3857');
                                    source.addFeatures(
                                        format.readFeatures(featureString)
                                    );
                                    source.loading = false;
                                }
                                var changeHandler = utils.debounce(function (e) {
                                    if (e.target.loading) return;
                                    me.push(layer, e.target);
                                }, debounceInterval);
                                source.on('changefeature', changeHandler);
                                source.on('addfeature', changeHandler);
                            });
                    })
            },

            /**
             * Get Layman friendly name for layer based on its title by
             * removing spaces, converting to lowercase
             * @memberof hs.layerSynchronizerService
             * @function getLayerName
             * @param {Ol.layer} layer Layer to get Layman friendly name for
             */
            getLayerName(layer) {
                return layer.get('title').toLowerCase().replaceAll(' ', '')
            },

            /**
             * Stop synchronizing layer to database
             * @memberof hs.layerSynchronizerService
             * @function removeLayer
             * @param {Ol.layer} layer Layer to remove from legend
             */
            removeLayer: function (layer) {
                for (var i = 0; i < me.syncedLayers.length; i++) {
                    if (me.syncedLayers[i] == layer) {
                        me.syncedLayers.splice(i, 1);
                        break;
                    }
                }
            },
        });

        hsMap.loaded().then(me.init);
        return me;
    }]