define(['ol', 'sparql_helpers'],

    function (ol, sparql_helpers) {
        var src = new ol.source.Vector();
        var $scope;
        var $compile;
        var map;
        var utils;
        var lyr;

        function entityClicked(entity) {
            $scope.showInfo(entity);
            if ($('#zone-info-dialog').length > 0) {
                angular.element('#zone-info-dialog').parent().remove();
            }
            var el = angular.element('<div hs.foodiezones.info-directive></div>');
            $("#hs-dialog-area").append(el);
            $compile(el)($scope);
        }

        src.cesiumStyler = function (dataSource) {
            var entities = dataSource.entities.values;
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (entity.styled) continue;
                var plotName = entity.properties.plotName;
                var cropName = entity.properties.cropName.getValue();
                entity.polygon.outline = false;
                entity.polygon.material = new Cesium.Color.fromCssColorString('rgba(150, 40, 40, 0.6)');
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                entity.label = new Cesium.LabelGraphics({
                    text: entity.properties.code.getValue() + ' '+ entity.properties.cropName.getValue(),
                    font: '16px Helvetica',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    showBackground: true,
                    style: Cesium.LabelStyle.FILL,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 30000.0),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 70000, 0.0),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                })
                entity.styled = true;
                //entity.onclick = entityClicked
            }
        }

        var me = {
            get: function (map, utils, rect) {
                if (map.getView().getResolution() > 20.48657133911758 || lyr.getVisible() == false) return;
                function prepareCords(c) {
                    return c.toString().replaceAll(',', ' ')
                }
                var extents = `POLYGON ((${prepareCords(rect[0])}, ${prepareCords(rect[1])}, ${prepareCords(rect[2])}, ${prepareCords(rect[3])}, ${prepareCords(rect[0])}, ${prepareCords(rect[1])}))`;
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent(`

                PREFIX geo: <http://www.opengis.net/ont/geosparql#>
                PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
                PREFIX virtrdf:	<http://www.openlinksw.com/schemas/virtrdf#> 
                PREFIX poi: <http://www.openvoc.eu/poi#> 
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                PREFIX common: <http://portele.de/ont/inspire/baseInspire#>
                PREFIX prov: <http://www.w3.org/ns/prov#>
                PREFIX olu: <http://w3id.org/foodie/olu#>
                PREFIX af-inspire: <http://inspire.ec.europa.eu/schemas/af/3.0#>
                
                SELECT ?plot ?plotName ?code ?shortId ?cropName ?cropArea ?coordPlot
                FROM <http://w3id.org/foodie/core/cz/CZpilot_fields#>
                WHERE{ 
                    ?plot a foodie:Plot ;
                       foodie:code ?code ;
                       foodie-cz:plotName ?plotName ;
                       foodie-cz:shortId ?shortId ;
                       foodie:crop ?cropSpecies ;
                       geo:hasGeometry ?geoPlot .
                    ?geoPlot ogcgs:asWKT  ?coordPlot .
                    ?cropSpecies foodie:cropArea ?cropArea ;
                       foodie:cropSpecies ?cropType .
                    ?cropType foodie:description ?cropName .
                    ${$scope.cropType!='' && typeof $scope.cropType!='undefined' && $scope.cropType != "http://w3id.org/foodie/core/CZpilot_fields/CropType/" ? `FILTER(?cropType = <${$scope.cropType}>).` : ''}
                    FILTER(bif:st_intersects (?coordPlot, bif:st_geomFromText("${extents}"))) .
                }               

                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';

                src.set('loaded', false);
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        sparql_helpers.fillFeatures(src, 'coordPlot', response, 'code', {plotName: 'plotName', plot: 'plot', shortId: 'shortId', code: 'code', cropName: 'cropName', cropArea: 'cropArea'}, map)
                    })
            },
            createLayer: function () {
                lyr = new ol.layer.Vector({
                    title: "Fields by crop types",
                    source: src,
                    visible: true,
                    style: function (feature, resolution) {
                        return [
                            new ol.style.Style({
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 0, 1)',
                                    width: 2
                                })
                            })
                        ];
                    }
                });
                return lyr;
            },
            fillClassificators(){
                var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent( `PREFIX foodie-cz: <http://foodie-cloud.com/model/foodie-cz#>
                PREFIX foodie: <http://foodie-cloud.com/model/foodie#>
                
                SELECT DISTINCT ?cropType ?cropName
                FROM <http://w3id.org/foodie/core/cz/CZpilot_fields#>
                WHERE{ 
                    ?plot a foodie:Plot ;
                       foodie:crop ?cropSpecies.
                    ?cropSpecies foodie:cropSpecies ?cropType .
                    ?cropType foodie:description ?cropName .
                }
                ORDER BY ?cropName
                `) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                $.ajax({
                    url: utils.proxify(q)
                })
                    .done(function (response) {
                        $scope.cropTypes = response.results.bindings.map(function(r){
                            return {name: r.cropName.value, id: r.cropType.value};
                        }) 
                    })
            },
            getLayer(){
                return lyr;
            },
            init: function (_$scope, _$compile, _map, _utils) {
                $scope = _$scope;
                $compile = _$compile;
                map = _map;
                utils = _utils;
                me.fillClassificators();
            }
        }
        return me;
    }
)