/**
 * @param $http
 * @param HsMapService
 * @param HsUtilsService
 * @param $rootScope
 */
export class HsWfsGetCapabilitiesService {
  constructor($http, HsMapService, HsUtilsService, $rootScope) {
    'ngInject';
    Object.assign(this, {
      $http,
      HsMapService,
      HsUtilsService,
      $rootScope,
    });
  }

  /**
   * Get WFS service location without parameters from url string
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WFS service Url without params
   */
  getPathFromUrl(str) {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * TODO: Probably the same as utils.paramsToURL
   * Create WFS parameter string from parameter object
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function param2String
   * @param {object} obj Object with stored WFS service parameters
   * @returns {string} Parameter string or empty string if no object given
   */
  params2String(obj) {
    return obj
      ? Object.keys(obj)
        .map((key) => {
          const val = obj[key];

          if (angular.isArray(val)) {
            return val
              .map((val2) => {
                return (
                  encodeURIComponent(key) + '=' + encodeURIComponent(val2)
                );
              })
              .join('&');
          }

          return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        })
        .join('&')
      : '';
  }

  /**
   * Parse added service url and sends request GetCapabalities to WFS service
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object -  Response to GetCapabalities request
   */
  requestGetCapabilities(service_url) {
    service_url = service_url.replace('&amp;', '&');
    this.service_url = service_url;
    const params = this.HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    if (
      angular.isUndefined(params.request) &&
      angular.isUndefined(params.REQUEST)
    ) {
      params.request = 'GetCapabilities';
    } else if (angular.isDefined(params.request)) {
      params.request = 'GetCapabilities';
    } else if (angular.isDefined(params.REQUEST)) {
      params.REQUEST = 'GetCapabilities';
    }
    if (
      angular.isUndefined(params.service) &&
      angular.isUndefined(params.SERVICE)
    ) {
      params.service = 'WFS';
    }
    if (
      angular.isUndefined(params.version) &&
      angular.isUndefined(params.VERSION)
    ) {
      params.version = '1.1.0';
    }
    let url = [path, this.params2String(params)].join('?');

    url = this.HsUtilsService.proxify(url);
    const promise = this.$http.get(url);
    promise.then((r) => {
      this.$rootScope.$broadcast('ows_wfs.capabilities_received', r);
    });
    return promise;
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function currentProjectionSupported
   * @param {Array} srss List of supported projections
   * @returns {boolean} True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss) {
    let found = false;
    angular.forEach(srss, (val) => {
      if (
        val
          .toUpperCase()
          .indexOf(
            this.HsMapService.map
              .getView()
              .getProjection()
              .getCode()
              .toUpperCase()
              .replace('EPSG:', 'EPSG::')
          ) > -1
      ) {
        found = true;
      }
    });
    return found;
  }

  /**
   * (DEPRECATED ?)
   *
   * @memberof HsWfsGetCapabilitiesService
   * @function getUrl
   * @param {} url
   * @param {} use_proxy
   */
  getUrl(url, use_proxy) {
    if (typeof use_proxy == 'undefined' || !use_proxy) {
      return url;
    } else {
      return (
        '/cgi-bin/proxy4ows.cgi?OWSURL=' +
        encodeURIComponent(url) +
        '&owsService=WMS'
      );
    }
  }
}
