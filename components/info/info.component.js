export default {
  template: require('components/info/partials/info.html'),
  controller: [
    '$rootScope',
    '$scope',
    '$timeout',
    'Core',
    function ($rootScope, $scope, $timeout, Core) {
      $scope.Core = Core;
      /**
       * @ngdoc property
       * @name hs.info#composition_loaded
       * @public
       * @type {Boolean} true
       * @description Store if composition is loaded
       */
      $scope.composition_loaded = true;
      /**
       * @ngdoc property
       * @name hs.info#layer_loading
       * @public
       * @type {Array} null
       * @description List of layers which are currently loading.
       */
      $scope.layer_loading = [];

      $scope.$on('compositions.composition_loading', (event, data) => {
        if (angular.isUndefined(data.error)) {
          if (angular.isDefined(data.data)) {
            /**
             * @ngdoc property
             * @name hs.info#composition_abstract
             * @public
             * @type {String} null
             * @description Abstract of current composition (filled when first composition is loaded)
             */
            $scope.composition_abstract = data.data.abstract;
            /**
             * @ngdoc property
             * @name hs.info#composition_title
             * @public
             * @type {String} null
             * @description Title of current composition (filled when first composition is loaded)
             */
            $scope.composition_title = data.data.title;
            /**
             * @ngdoc property
             * @name hs.info#composition_id
             * @public
             * @type {Number} null
             * @description Id of current composition (filled when first composition is loaded)
             */
            $scope.composition_id = data.data.id;
          } else {
            $scope.composition_abstract = data.abstract;
            $scope.composition_title = data.title;
            $scope.composition_id = data.id;
          }
          $scope.composition_loaded = false;
          //Composition image (should be glyphicon?)
          $scope.info_image = 'icon-map';
        }
      });

      $scope.$on('compositions.composition_loaded', (event, data) => {
        if (angular.isDefined(data.error)) {
          const temp_abstract = $scope.composition_abstract;
          const temp_title = $scope.composition_title;
          $scope.composition_abstract = data.abstract;
          $scope.composition_title = data.title;
          $scope.info_image = 'icon-warning-sign';
          $timeout(() => {
            $scope.composition_title = temp_title;
            $scope.composition_abstract = temp_abstract;
            $scope.info_image = 'icon-map';
          }, 3000);
        }
        $scope.composition_loaded = true;
        /**
         * @ngdoc property
         * @name hs.info#composition_edited
         * @public
         * @type {Boolean} null
         * @description Status of composition edit (true for edited composition)
         */
        $scope.composition_edited = false;
      });

      $scope.$on('layermanager.layer_loading', (event, layer) => {
        let somethingChanged = false;
        if (!(layer.get('title') in $scope.layer_loading)) {
          $scope.layer_loading.push(layer.get('title'));
          somethingChanged = true;
        }
        $scope.composition_loaded = false;
        if (somethingChanged) {
          forceRedraw();
        }
      });

      function forceRedraw() {
        $timeout(() => {}, 0);
      }

      $scope.$on('layermanager.layer_loaded', (event, layer) => {
        let somethingChanged = false;
        for (let i = 0; i < $scope.layer_loading.length; i++) {
          if ($scope.layer_loading[i] == layer.get('title')) {
            $scope.layer_loading.splice(i, 1);
            somethingChanged = true;
          }
        }

        if ($scope.layer_loading.length == 0) {
          if (!$scope.composition_loaded) {
            $scope.composition_loaded = true;
            somethingChanged = true;
          }
        }
        if (somethingChanged) {
          forceRedraw();
        }
      });

      $scope.$on('compositions.composition_deleted', (event, composition) => {
        if (composition.id == $scope.composition_id) {
          delete $scope.composition_title;
          delete $scope.composition_abstract;
        }
      });

      $scope.$on('core.map_reset', (event) => {
        $timeout(() => {
          delete $scope.composition_title;
          delete $scope.composition_abstract;
          $scope.layer_loading.length = 0;
          $scope.composition_loaded = true;
          $scope.composition_edited = false;
        });
      });

      /**
       * @ngdoc method
       * @name hs.info#compositionLoaded
       * @public
       * @description Test if composition is loaded, to change info template.
       */
      $scope.compositionLoaded = function () {
        return angular.isDefined($scope.composition_title);
      };

      $rootScope.$on('compositions.composition_edited', (event) => {
        $scope.composition_edited = true;
      });

      $scope.$emit('scope_loaded', 'info');
    },
  ],
};
