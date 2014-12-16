'use strict';

var hsl_path = '/hslayers-ng/';
//https://github.com/tnajdek/angular-requirejs-seed
require.config({
    paths: {
        angular: hsl_path+'bower_components/angular/angular',
        toolbar: hsl_path+'components/toolbar/toolbar',
        layermanager: hsl_path+'components/layermanager/layermanager',
        map: hsl_path+'components/map/map',
        ol: 'http://openlayers.org/en/v3.0.0/build/ol',
        ows: hsl_path+'components/ows/ows',
        'ows.wms': hsl_path+'components/ows/ows_wms',
        'ows.nonwms': hsl_path+'components/ows/ows_nonwms',
        'ows.wmsprioritized': hsl_path+'components/ows/ows_wmsprioritized',
        query: hsl_path+'components/query/query',
        search: hsl_path+'components/search/search',
        print: hsl_path+'components/print/print',
        permalink: hsl_path+'components/permalink/permalink',
        lodexplorer: hsl_path+'components/lodexplorer/lodexplorer',
        measure: hsl_path+'components/measure/measure',
        legend: hsl_path+'components/legend/legend',
        app: 'app',
        xml2json: hsl_path+'lib/xml2json.min',
        panoramio: hsl_path+'components/panoramio/panoramio'
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
    },
    priority: [
        "angular"
    ]
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require([
    'angular',
    'ol',
    'app'
], function(angular, ol, app) {
    var $html = angular.element(document.getElementsByTagName('html')[0]);
    angular.element().ready(function() {
        angular.resumeBootstrap([app['name']]);
    });
    
});
