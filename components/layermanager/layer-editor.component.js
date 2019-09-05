import { Stroke, Fill, Circle, RegularShape } from 'ol/style';
import { transform, get as getProj, METERS_PER_UNIT, transformExtent } from 'ol/proj';
import { WMSCapabilities } from 'ol/format';

export default {
    template: require('./partials/layer-editor.html'),
    bindings: {
        currentLayer: '='
    },
    controller: ['$scope', 'Core', '$compile', 'hs.utils.service',
        'hs.utils.layerUtilsService', 'config', 'hs.layermanager.WMSTservice',
        'hs.legend.service', 'hs.styler.service', 'hs.map.service', 
        'hs.layermanager.service', 'hs.wms.getCapabilitiesService', '$rootScope',
        function ($scope, Core, $compile, utils, layerUtils, config, WMST, legendService, styler, hsMap, LayMan, getCapabilitiesService, $rootScope) {
            angular.extend($scope, {
                layer_renamer_visible: false,
                legendService,
                layerIsWmsT: WMST.layerIsWmsT,
                /**
                 * @function isLayerWMS
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layer is WMS layer
                 */
                isLayerWMS: layerUtils.isLayerWMS,
                /**
                 * @function zoomToLayer
                 * @memberOf hs.layermanager.controller
                 * @description Zoom to selected layer (layer extent). Get extent 
                 * from bounding box property, getExtent() function or from 
                 * BoundingBox property of GetCapabalities request (for WMS layer)
                 * @param {Ol.layer} layer Selected layer
                 */
                zoomToLayer(layer) {
                    //debugger;
                    var extent = null;
                    if (layer.get("BoundingBox")) {
                        extent = getExtentFromBoundingBoxAttribute(layer);
                    } else if (angular.isDefined(layer.getSource().getExtent)) {
                        extent = layer.getSource().getExtent();
                    }
                    if (extent == null && $scope.isLayerWMS(layer)) {
                        var url = null;
                        if (layer.getSource().getUrls) //Multi tile
                            url = layer.getSource().getUrls()[0];
                        if (layer.getSource().getUrl) //Single tile
                            url = layer.getSource().getUrl();
                        getCapabilitiesService.requestGetCapabilities(url)
                            .then(function (capabilities_xml) {
                                //debugger;
                                var parser = new WMSCapabilities();
                                var caps = parser.read(capabilities_xml);
                                if (angular.isArray(caps.Capability.Layer)) {
                                    angular.forEach(caps.Capability.Layer, function (layer_def) {
                                        if (layer_def.Name == layer.params.LAYERS) {
                                            layer.set('BoundingBox', layer_def.BoundingBox)
                                        }
                                    })
                                }
                                if (angular.isObject(caps.Capability.Layer)) {
                                    layer.set('BoundingBox', caps.Capability.Layer.BoundingBox);
                                    extent = getExtentFromBoundingBoxAttribute(layer);
                                    if (extent != null)
                                    hsMap.map.getView().fit(extent, hsMap.map.getSize());
                                }
                            })
                    }
                    if (extent != null)
                        hsMap.map.getView().fit(extent, hsMap.map.getSize());
                },

                /**
                 * @function styleLayer
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Display styler panel for selected layer, so user can change its style
                 */
                styleLayer(layer) {
                    styler.layer = layer;
                    Core.setMainPanel('styler');
                },

                /**
                 * @function toggleLayerRename
                 * @memberOf hs.layermanager.controller
                 * @description Toogle layer rename control on panel (through layer rename variable)
                 */
                toggleLayerRename() {
                    $scope.layer_renamer_visible = !$scope.layer_renamer_visible;
                },

                showRemoveLayerDiag(e, layer) {
                    try {
                        var $mdDialog = $injector.get('$mdDialog');

                        var confirm = $mdDialog.confirm()
                            .title('Remove layer ' + layer.title)
                            .textContent('Are you sure about layer removal?')
                            .ariaLabel('Confirm layer removal')
                            .targetEvent(e)
                            .ok('Remove')
                            .cancel('Cancel')
                            .hasBackdrop(false);

                        $mdDialog.show(confirm).then(function () {
                            $scope.removeLayer(layer.layer);
                        }, function () {
                        });
                    } catch (ex) { }
                },

                /**
                * @function setLayerOpacity
                * @memberOf hs.layermanager.controller
                * @deprecated
                * @description Set selected layers opacity and emits "compositionchanged"
                * @param {Ol.layer} layer Selected layer
                */
                setLayerOpacity(layer) {
                    if (angular.isUndefined(layer)) return;
                    layer.setOpacity($scope.cur_layer_opacity);
                    $scope.$emit('compositions.composition_edited');
                    return false;
                },

                /**
                * @function setOpacity
                * @memberOf hs.layermanager.controller
                * @description Set selected layers opacity and emits "compositionchanged"
                * @param {Ol.layer} layer Selected layer
                */
                setOpacity(layer) {
                    layer.layer.setOpacity(layer.opacity);
                    $scope.$emit('compositions.composition_edited');
                },

                /**
                 * @function layerIsZoomable
                 * @memberOf hs.layermanager.controller
                 * @description Determines if layer has BoundingBox defined as 
                 * its metadata or is a Vector layer. Used for setting visibility 
                 * of 'Zoom to ' button
                 * @param {Ol.layer} layer Selected layer
                 */
                layerIsZoomable: layerUtils.layerIsZoomable,

                /**
                 * @function layerIsStyleable
                 * @memberOf hs.layermanager.controller
                 * @description Determines if layer is a Vector layer and 
                 * styleable. Used for allowing styling
                 * @param {Ol.layer} layer Selected layer
                 */
                layerIsStyleable: layerUtils.layerIsStyleable,

                /**
                * @function setLayerResolution
                * @memberOf hs.layermanager.controller
                * @param {Ol.layer} layer Selected layer
                * @description Set max and min resolution for selected layer 
                * (with layer params changed in gui)
                */
                setLayerResolution(layer) {
                    if (typeof layer == 'undefined') return false;
                    layer.setMinResolution(layer.minResolution);
                    layer.setMaxResolution(layer.maxResolution);
                },

                /**
                * @function isLayerRemovable
                * @memberOf hs.layermanager.controller
                * @description Check if layer can be removed based on 'removable' 
                * layer attribute
                * @param {Ol.layer} lyr OL layer to check if removable
                */
                isLayerRemovable(lyr) {
                    return angular.isDefined(lyr) && (angular.isUndefined(lyr.get('removable')) || lyr.get('removable') == true);
                },

                removeLayer(layer) {
                    hsMap.map.removeLayer(layer);
                    $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
                },

                saveStyle(layer) {
                    setLayerStyle(layer);
                },

                /**
                 * @function isScaleVisible
                 * @memberOf hs.layermanager.controller
                 * @param {Ol.layer} layer Selected layer
                 * @description Test if layer has min and max relolution set
                 */
                isScaleVisible(layer) {
                    if (typeof layer == 'undefined') return false;
                    layer.minResolutionValid = false;
                    layer.maxResolutionValid = false;
                    if (angular.isDefined(layer.getMinResolution()) && layer.getMinResolution() != 0) {
                        layer.minResolutionValid = true;
                        layer.minResolution = layer.getMinResolution();
                    }
                    if (angular.isDefined(layer.getMaxResolution()) && layer.getMaxResolution() != Infinity) {
                        layer.maxResolutionValid = true;
                        layer.maxResolution = layer.getMaxResolution();
                    }

                    if (layer.minResolutionValid || layer.maxResolutionValid) {
                        return true;
                    } else {
                        return false;
                    }
                },

                /**
                * @function isLayerWithDimensions
                * @memberOf hs.layermanager.controller
                * @param {Ol.layer} lyr Selected layer
                * @description Test if layer has dimensions
                */
                isLayerWithDimensions(lyr_container) {
                    if (angular.isUndefined(lyr_container) || lyr_container == null || angular.isUndefined(lyr_container.layer)) return false;
                    if (angular.isUndefined(lyr_container.layer.get('dimensions'))) return false;
                    return Object.keys(lyr_container.layer.get('dimensions')).length > 0
                },

                /**
                 * @function setTitle
                 * @memberOf hs.layermanager.controller
                 * @desription Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
                 */
                setTitle() {
                    LayMan.currentLayer.layer.set('title', LayMan.currentLayer.title);
                },

                expandLayer(layer) {
                    if (angular.isUndefined(layer.expanded)) layer.expanded = true;
                    else layer.expanded = !layer.expanded;
                },

                expandSettings(layer, value) {
                    if (angular.isUndefined(layer.opacity)) {
                        layer.opacity = layer.layer.getOpacity();
                        layer.maxResolutionLimit = layer.layer.getMaxResolution();
                        layer.minResolutionLimit = layer.layer.getMinResolution();
                        layer.maxResolution = layer.maxResolutionLimit;
                        layer.minResolution = layer.minResolutionLimit;
                    }
                    if (angular.isUndefined(layer.style) && layer.layer.getSource().styleAble) getLayerStyle(layer);
                    layer.expandSettings = value;
                },

                expandFilter(layer, value) {
                    layer.expandFilter = value;
                    LayMan.currentLayer = layer;
                    $scope.currentLayer = LayMan.currentLayer;
                },

                updateResolution(layer) {
                    layer.layer.setMaxResolution(layer.maxResolution);
                    layer.layer.setMinResolution(layer.minResolution);
                },

                expandInfo(layer, value) {
                    layer.expandInfo = value;
                },

                /**
                 * @function dateToNonUtc
                 * @memberOf hs.layermanager.controller
                 * @param {Date} d Date to convert
                 * @description Convert date to non Utc format
                 */
                dateToNonUtc(d) {
                    if (angular.isUndefined(d)) return;
                    var noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
                    return noutc;
                }
            });

            function setLayerStyle(wrapper) {
                //debugger;
                var layer = wrapper.layer;
                var source = layer.getSource();
                var style = wrapper.style.style;
                if (source.hasPoly) {
                    style.setFill(new Fill({
                        color: wrapper.style.fillColor
                    }));
                }
                if (source.hasLine || source.hasPoly) {
                    style.setStroke(new Stroke({
                        color: wrapper.style.lineColor,
                        width: wrapper.style.lineWidth
                    }));
                }
                if (source.hasPoint) {
                    var image;
                    var stroke = new Stroke({
                        color: wrapper.style.pointStroke,
                        width: wrapper.style.pointWidth
                    });
                    var fill = new Fill({
                        color: wrapper.style.pointFill
                    });
                    if (wrapper.style.pointType === 'Circle') {
                        image = new Circle({
                            stroke: stroke,
                            fill: fill,
                            radius: wrapper.style.radius,
                            rotation: wrapper.style.rotation
                        });
                    }
                    if (wrapper.style.pointType === 'Polygon') {
                        image = new RegularShape({
                            stroke: stroke,
                            fill: fill,
                            radius: wrapper.style.radius,
                            points: wrapper.style.pointPoints,
                            rotation: wrapper.style.rotation
                        });
                    }
                    if (wrapper.style.pointType === 'Star') {
                        image = new RegularShape({
                            stroke: stroke,
                            fill: fill,
                            radius1: wrapper.style.radius,
                            radius2: wrapper.style.radius2,
                            points: wrapper.style.pointPoints,
                            rotation: wrapper.style.rotation
                        });
                    }
                    style.setImage(image);
                }
                layer.setStyle(style);
            }

            /**
             * (PRIVATE) Get transformated extent from layer "BoundingBox" property
             * @function getExtentFromBoundingBoxAttribute
             * @memberOf hs.layermanager.controller
             * @param {Ol.layer} layer Selected layer
             */
            function getExtentFromBoundingBoxAttribute(layer) {
                var extent = null;
                var bbox = layer.get("BoundingBox");
                if (angular.isArray(bbox) && bbox.length == 4) {
                    extent = transformExtent(bbox, 'EPSG:4326', hsMap.map.getView().getProjection());
                } else {
                    for (var ix = 0; ix < bbox.length; ix++) {
                        if (angular.isDefined(getProj(bbox[ix].crs)) || angular.isDefined(layer.getSource().getParams().FROMCRS)) {
                            var crs = bbox[ix].crs || layer.getSource().getParams().FROMCRS;
                            var b = bbox[ix].extent;
                            var first_pair = [b[0], b[1]]
                            var second_pair = [b[2], b[3]];
                            first_pair = transform(first_pair, crs, hsMap.map.getView().getProjection());
                            second_pair = transform(second_pair, crs, hsMap.map.getView().getProjection());
                            extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                            break;
                        }
                    }
                }
                return extent;
            }

            function getLayerStyle(wrapper) {
                var layer = wrapper.layer;
                var source = layer.getSource();
                wrapper.style = {};
                if (angular.isUndefined(layer.getStyle)) return;
                var style = layer.getStyle();
                if (typeof style == 'function') 
                    style = style(source.getFeatures()[0]);
                if (typeof style == 'object') style = style[0];
                style = style.clone();
                if (source.hasPoly) {
                    wrapper.style.fillColor = style.getFill().getColor();
                }
                if (source.hasLine || source.hasPoly) {
                    wrapper.style.lineColor = style.getStroke().getColor();
                    wrapper.style.lineWidth = style.getStroke().getColor();
                }
                if (source.hasPoint) {
                    var image = style.getImage();
                    if (utils.instOf(image, Circle)) 
                        wrapper.style.pointType = 'Circle';
                    else if (utils.instOf(image, RegularShape)) {
                        wrapper.style.pointPoints = image.getPoints();
                        wrapper.style.rotation = image.getRotation();
                        if (angular.isUndefined(image.getRadius2())) 
                            wrapper.style.pointType = 'Polygon';
                        else {
                            wrapper.style.pointType = 'Star';
                            wrapper.style.radius2 = image.getRadius2();
                        }
                    }
                    if (utils.instOf(image, Circle) || utils.instOf(image, RegularShape)) {
                        wrapper.style.radius = image.getRadius();
                        wrapper.style.pointFill = image.getFill().getColor();
                        wrapper.style.pointStroke = image.getStroke().getColor();
                        wrapper.style.pointWidth = image.getStroke().getWidth();
                    }
                    if (angular.isUndefined(wrapper.style.radius2)) 
                        wrapper.style.radius2 = wrapper.style.radius / 2;
                    if (angular.isUndefined(wrapper.style.pointPoints)) 
                        wrapper.style.pointPoints = 4;
                    if (angular.isUndefined(wrapper.style.rotation)) 
                        wrapper.style.rotation = Math.PI / 4;
                }
                wrapper.style.style = style;
            }

        }]
}