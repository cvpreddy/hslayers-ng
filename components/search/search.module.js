/* eslint-disable angular/no-service-method */
import '../permalink/permalink.module';
import '../styles/styles.module';
import searchController from './search.controller';
import searchDirective from './search.directive';
import searchInputDirective from './search-input.directive';
import searchResultsDirective from './search-results.directive';
import {HsSearchService} from './search.service';

/**
 * @namespace hs.search
 * @memberOf hs
 */
angular
  .module('hs.search', ['hs.map', 'hs.styles', 'hs.layout'])
  /**
   * @memberof hs.search
   * @ngdoc directive
   * @name hs.search.directiveSearchinput
   * @description Add search input template to page, with automatic change event and clear button
   */
  .directive('hs.search.directiveSearchinput', searchInputDirective)

  .directive('hs.search.directiveSearchresults', searchResultsDirective)
  .directive('hs.search.directive', searchDirective)

  /**
   * @memberof hs.search
   * @ngdoc service
   * @name HsSearchService
   * @description Provides geolocation search request from site selected in config (geonames/sdi4apps) and pass response to handler on success
   */
  .service('HsSearchService', HsSearchService)

  /**
   * @memberof hs.search
   * @ngdoc controller
   * @name HsSearchController
   */
  .controller('HsSearchController', searchController);
