/* eslint-disable angular/no-service-method */
import '../layout';
import * as angular from 'angular';

import {HsDrawComponent} from './draw.component';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
import {HsDrawModule} from './draw.module';
import {HsDrawService} from './draw.service';
import {HsDrawToolbarComponent} from './draw-toolbar.component';

import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsDrawModule);
/**
 * @namespace hs.draw
 * @memberof hs
 */
angular
  .module(downgradedModule, ['hs.map', 'hs.utils', 'hs.layout'])
  .service('HsDrawService', downgradeInjectable(HsDrawService))
  .directive('hs.draw', downgradeComponent({component: HsDrawComponent}))
  .directive(
    'hs.drawToolbar',
    downgradeComponent({component: HsDrawToolbarComponent})
  )
  .directive(
    'hs.drawLayerMetadata',
    downgradeComponent({component: HsDrawLayerMetadataDialogComponent})
  );

angular.module('hs.draw', [downgradedModule]);
export {HsDrawModule} from './draw.module';
