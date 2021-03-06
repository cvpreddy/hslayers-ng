import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareComponent} from './share.component';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {WINDOW_PROVIDERS} from '../utils/window';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HsPanelHelpersModule,
  ],
  exports: [HsShareComponent],
  providers: [
    HsShareService,
    HsShareUrlService,
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    WINDOW_PROVIDERS,
  ],
  entryComponents: [HsShareComponent],
})
export class HsShareModule {}
