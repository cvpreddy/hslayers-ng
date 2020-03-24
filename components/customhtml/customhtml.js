/**
 * @namespace hs.customhtml
 * @memberOf hs
 */
define(['angular', 'ol'],
    function(angular, ol) {
        angular.module('hs.customhtml', [])
            .directive('hs.customhtml.directive', ['config', function (config) {
                return {
                    templateUrl: config.hsl_path + 'customhtml.html',
                    link: function link(scope, element, attrs) {},
                    replace: true
                };
            }])
            .controller('hs.customhtml.controller', ['$scope', function($scope) {

            }])
    })