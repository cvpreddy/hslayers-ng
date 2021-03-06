/* eslint-disable angular/definedundefined */
import {Component, Inject, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsLayoutService} from '../layout/layout.service';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import moment = require('moment');
import { HsDialogContainerService } from '../layout/dialogs/dialog-container.service';

@Component({
  selector: 'hs-sensor-unit',
  template: require('./partials/unit-dialog.html'),
})
export class HsSensorsUnitDialogComponent implements HsDialogComponent {
  customInterval = {name: 'Custom', fromTime: new Date()};
  loaderImage = require('../../img/ajax-loader.gif');

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsSensorsUnitDialogService: HsSensorsUnitDialogService
  ) {
    this.HsSensorsUnitDialogService.unitDialogVisible = true;
  }
  viewRef: ViewRef;
  data: any;

  ngOnInit(): void {
    this.timeButtonClicked(this.HsSensorsUnitDialogService.intervals[2]);
  }

  /**
   * @memberof hs.sensors.unitDialog
   * @function sensorClicked
   * @param {object} sensor Clicked sensor
   * @description Regenerate chart for sensor is clicked. If no
   * interval was clicked before use 1 day timeframe by default.
   */
  sensorClicked(sensor): void {
    this.HsSensorsUnitDialogService.selectSensor(sensor);
    if (this.HsSensorsUnitDialogService.currentInterval == undefined) {
      this.timeButtonClicked({amount: 1, unit: 'days'});
    } else {
      this.HsSensorsUnitDialogService.createChart(
        this.HsSensorsUnitDialogService.unit
      );
    }
  }

  /**
   * @memberof hs.sensors.unitDialog
   * @function timeButtonClicked
   * @param {object} interval Clicked interval button
   * @description Get data for different time interval and regenerate
   * chart
   */
  timeButtonClicked(interval): void {
    this.HsSensorsUnitDialogService.currentInterval = interval;
    this.customInterval.fromTime = this.HsSensorsUnitDialogService.getTimeForInterval(
      interval
    ).toDate();
    this.HsSensorsUnitDialogService.getObservationHistory(
      this.HsSensorsUnitDialogService.unit,
      interval
    ).then((_) => {
      this.HsSensorsUnitDialogService.createChart(
        this.HsSensorsUnitDialogService.unit
      );
    });
  }

  customIntervalChanged(): void {
    this.HsSensorsUnitDialogService.currentInterval = this.customInterval;
    this.HsSensorsUnitDialogService.getObservationHistory(
      this.HsSensorsUnitDialogService.unit,
      this.customInterval
    ).then((_) =>
      this.HsSensorsUnitDialogService.createChart(
        this.HsSensorsUnitDialogService.unit
      )
    );
  }

  dialogStyle() {
    return {
      'visibility': this.HsSensorsUnitDialogService.unitDialogVisible
        ? 'visible'
        : 'hidden',
      'left': this.HsLayoutService.sidebarBottom()
        ? '3px'
        : this.HsLayoutService.panelSpaceWidth() + 10 + 'px',
      'width': this.HsLayoutService.sidebarBottom()
        ? '100%'
        : 'calc(' + this.HsLayoutService.widthWithoutPanelSpace() + ')',
      'bottom': this.HsLayoutService.sidebarBottom() ? '46.5em' : '0',
      'height': this.HsLayoutService.sidebarBottom() ? '5em' : 'auto',
    };
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
    this.HsSensorsUnitDialogService.unitDialogVisible = false;
  }
}
