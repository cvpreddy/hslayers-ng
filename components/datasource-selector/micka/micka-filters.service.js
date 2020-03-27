export default ['$rootScope', 'hs.map.service', 'Core', 'config', '$http', '$q', 'hs.utils.service',
  function ($rootScope, OlMap, Core, config, $http, $q, utils) {
    const me = this;
    this.suggestionConfig = {};
    this.suggestions = [];
    this.suggestionsLoaded = true;
    this.filterByExtent = true;
    me.otnKeywords = [];

    if (config.datasources && config.datasources.filter(ds => ds.url.indexOf('opentnet.eu') > -1).length > 0) {
      $http({
        method: 'GET',
        url: utils.proxify('http://opentransportnet.eu:8082/api/3/action/vocabulary_show?id=36c07014-c461-4f19-b4dc-a38106144e66')
      }).then((response) => {
        me.otnKeywords = [{title: '-'}];
        angular.forEach(response.data.result.tags, (tag) => {
          me.otnKeywords.push({title: tag.name});
        });
      });
    }

    /**
        * @function fillCodesets
        * @memberOf hs.datasourceBrowserService
        * @param {Object} datasets Input datasources
        * Download codelists for all "micka" type datasources from Url specified in app config.
        */
    me.fillCodesets = function (datasets) {
      for (const ds in datasets) {
        me.fillCodeset(datasets[ds]);
      }
    };

    /**
        * @function fillCodeset
        * @memberOf hs.datasourceBrowserService
        * @param {Object} ds Single datasource
        * Download code-list for micka type source from Url specifiead in app config.
        */
    me.fillCodeset = function (ds) {
      if (ds.type == 'micka') {
        let url = ds.code_list_url;
        url = utils.proxify(url);
        if (angular.isUndefined(ds.code_lists)) {
          ds.code_lists = {
            serviceType: [],
            applicationType: [],
            dataType: [],
            topicCategory: []
          };
        }
        if (angular.isDefined(ds.canceler)) {
          ds.canceler.resolve();
          delete ds.canceler;
        }
        ds.canceler = $q.defer();
        $http.get(url, {timeout: ds.canceler.promise}).then(
          (j) => {
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(j.data, 'application/xml');
            const doc = oDOM.documentElement;
            doc.querySelectorAll('map serviceType value').forEach((type) => {
              ds.code_lists.serviceType.push({
                value: type.attributes.name.value,
                name: type.innerHTML
              });
            });
            doc.querySelectorAll('map applicationType value').forEach((type) => {
              ds.code_lists.applicationType.push({
                value: type.attributes.name.value,
                name: type.innerHTML
              });
            });
            doc.querySelectorAll('map topicCategory value').forEach((type) => {
              ds.code_lists.topicCategory.push({
                value: type.attributes.name.value,
                name: type.innerHTML
              });
            });
            me.advancedMickaTypeChanged(ds, 'service');
          }, (err) => { }
        );
      }
    };

    /**
    * @function advancedMickaTypeChanged
    * @memberOf hs.datasourceBrowserService
    * @param {Object} mickaDS Micka dataset definition
    * @param {String} type Micka query type
    * Sets Micka source level types according to current query type (service/appilication). Deprecated?
    */
    me.advancedMickaTypeChanged = function (mickaDS, type) {
      if (angular.isUndefined(mickaDS.code_lists)) {
        return;
      }
      switch (type) {
        default:
        case 'service':
          mickaDS.level2_types = mickaDS.code_lists.serviceType;
          break;
        case 'application':
          mickaDS.level2_types = mickaDS.code_lists.applicationType;
          break;
      }
    };

    me.changeSuggestionConfig = function (input, param, field) {
      me.suggestionConfig = {
        input: input,
        param: param,
        field: field
      };
    };

    /**
    * @function suggestionFilterChanged
    * @memberOf hs.datasourceBrowserService
    * @param {object} mickaDS Micka catalogue config passed here from directive
    * Send suggestion request to Micka CSW server and parse response
    */
    me.suggestionFilterChanged = function (mickaDS) {
      let url = mickaDS.url + '../util/suggest.php?' + utils.paramsToURL({
        type: me.suggestionConfig.param,
        query: me.suggestionFilter
      });
      url = utils.proxify(url);
      me.suggestionsLoaded = false;
      me.suggestions = [];
      $http({
        method: 'GET',
        url: url
      }).then((response) => {
        const j = response.data;
        me.suggestionsLoaded = true;
        me.suggestions = j.records;
      });
    };
    return me;
  }
];