import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
@Component({
  selector: 'hs.save-map-dialog-result',
  template: require('./partials/dialog_result.html'),
})
export class HsSaveMapResultDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
