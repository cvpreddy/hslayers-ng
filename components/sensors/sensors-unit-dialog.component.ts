/* eslint-disable angular/definedundefined */
import 'angularjs-bootstrap-datetimepicker/src/css/datetimepicker.css';
import 'angularjs-bootstrap-datetimepicker/src/js/datetimepicker';
import 'angularjs-bootstrap-datetimepicker/src/js/datetimepicker.templates';
import {Component} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service.js';
import {HsSensorUnit} from './sensor-unit.class';
import {HsSensorsUnitDialogService} from './unit-dialog.service';

@Component({
  selector: 'hs-sensor-unit',
  template: require('./partials/unit-dialog.html'),
})
export class HsSensorsUnitDialogComponent implements HsDialogComponent {
  intervals = [
    {name: '1H', amount: 1, unit: 'hours'},
    {name: '1D', amount: 1, unit: 'days'},
    {name: '1W', amount: 1, unit: 'weeks'},
    {name: '1M', amount: 1, unit: 'months'},
    {name: '6M', amount: 6, unit: 'months'},
  ];
  customInterval = {name: 'Custom', fromTime: new Date()};
  loaderImage = require('../../img/ajax-loader.gif');

  constructor(
    private HsMapService: HsMapService,
    private HsLayoutService: HsLayoutService,
    private HsSensorsUnitDialogService: HsSensorsUnitDialogService
  ) {
    this.HsSensorsUnitDialogService.unitDialogVisible = true;
  }
  data: any;

  /**
   * @memberof hs.sensors.unitDialog
   * @function sensorClicked
   * @param {object} sensor Clicked sensor
   * @description Regenerate chart for sensor is clicked. If no
   * interval was clicked before use 1 day timeframe by default.
   */
  sensorClicked(sensor) {
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
  timeButtonClicked(interval) {
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

  customIntervalChanged() {
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
}