import {Component} from '@angular/core';

import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';

@Component({
  selector: 'hs-toolbar',
  template: require('./partials/toolbar.html'),
})
export class HsToolbarComponent {
  collapsed = false;
  composition_title: any;
  composition_abstract: any;
  constructor(
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsCoreService: HsCoreService
  ) {
    this.HsEventBusService.mapResets.subscribe(() => {
      setTimeout(() => {
        delete this.composition_title;
        delete this.composition_abstract;
      });
    });
  }

  measureButtonClicked() {
    this.HsLayoutService.setMainPanel('measure', true);
  }

  /**
   * Change/read collapsed setting
   *
   * @memberof hs.toolbar.controller
   * @function collapsed
   * @returns {boolean} Collapsed state
   * @param {boolean} is Value to set collapsed state to
   */
  isCollapsed(is) {
    if (arguments.length > 0) {
      this.collapsed = is;
    }
    return this.collapsed;
  }
  // $scope.$emit('scope_loaded', 'Toolbar');
}
