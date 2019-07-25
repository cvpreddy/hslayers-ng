export default {
    template: require('components/add-layers/partials/add-layers.directive.html'),
    controller: ['$scope', '$injector', 'hs.wms.getCapabilitiesService', 'hs.wmts.getCapabilitiesService', 'hs.wfs.getCapabilitiesService', 'hs.map.service', 'hs.permalink.urlService', 'Core', 'hs.addLayersVector.service', 'config', '$rootScope', '$timeout',
        function ($scope, $injector, srv_wms_caps, srv_wmts_caps, srv_wfs_caps, OlMap, permalink, Core, nonwmsservice, config, $rootScope, $timeout) {
            $scope.Core = Core;
            var map = OlMap.map;
            if (angular.isArray(config.connectTypes)) {
                $scope.types = config.connectTypes;
            } else {
                $scope.types = [
                    { id: "wms", text: "Web map service (WMS)" },
                    { id: "vector", text: "Vector file (GeoJson, KML)" }
                ];
            }
            $scope.type = "";
            $scope.image_formats = [];
            $scope.query_formats = [];
            $scope.tile_size = 512;

            /**
            * Change detail panel template according to selected type
            * @memberof hs.addLayers
            * @function templateByType
            * @return {String} template Path to correct type template
            */
            /**TODO: move variables out of this function. Call $scope.connected = false when template change */
            $scope.templateByType = function () {
                var template;
                switch ($scope.type.toLowerCase()) {
                    case "wms":
                        template = '<hs.add-layers-wms/>';
                        break;
                    case "wmts":
                        template = '<hs.add-layers-wmts/>';
                        break;
                    case "wfs":
                        template = '<hs.add-layers-wfs/>';
                        break;
                    case "vector":
                        template = '<hs.add-layers-vector/>';
                        $scope.showDetails = true;
                        break;
                    default:
                        break;
                }
                return template;
            };

            function connectServiceFromUrlParam(type) {
                if (permalink.getParamValue(`${type}_to_connect`)) {
                    var url = permalink.getParamValue(`${type}_to_connect`);
                    Core.setMainPanel(Core.singleDatasources ? 'datasource_selector' : 'ows');
                    $scope.type = type.toUpperCase();
                    $timeout(function () {
                        $rootScope.$broadcast(`ows.${type}_connecting`, url);
                    })
                }
            }

            connectServiceFromUrlParam('wms');
            connectServiceFromUrlParam('wfs');

            $scope.$emit('scope_loaded', "Ows");
        }
    ]
}