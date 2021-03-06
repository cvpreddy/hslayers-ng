import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
@Component({
  selector: 'hs-sync-error-dialog',
  template: require('./sync-error-dialog.html'),
})
export class HsSyncErrorDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;
  @Input() exception: any;
}
