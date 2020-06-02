import VectorLayer from 'ol/layer/Vector';
import moment from 'moment';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {Vector as VectorSource} from 'ol/source';
import {WKT} from 'ol/format';
import {getWidth} from 'ol/extent';
import {default as vegaEmbed} from 'vega-embed';

/**
 * @param HsUtilsService
 * @param $http
 * @param HsConfig
 * @param HsMapService
 * @param HsLayoutService
 * @param $rootScope
 * @param $compile
 * @param $timeout
 * @param $interval
 * @param $log
 */
export class sensorsService {
  constructor(
    HsUtilsService,
    $http,
    HsConfig,
    HsMapService,
    HsLayoutService,
    $rootScope,
    $compile,
    $timeout,
    $interval,
    $log
  ) {
    'ngInject';

    angular.extend(this, {
      endpoint: HsConfig.senslog,
      units: [],
      sensorsSelected: [],
      sensorIdsSelected: [],
      sensorById: {},
      layer: null,
      HsUtilsService,
      $http,
      HsConfig,
      HsMapService,
      HsLayoutService,
      $rootScope,
      $compile,
      $timeout,
      $interval,
      $log,
    });

    this.setupListeners();
  }

  setupListeners() {
    // eslint-disable-next-line angular/on-watch
    this.$rootScope.$on(
      'vectorQuery.featureSelected',
      this.HsUtilsService.debounce(
        (event, feature) => {
          if (feature.getLayer(this.HsMapService.map) == this.layer) {
            this.HsLayoutService.setMainPanel('sensors');
            this.units.forEach((unit) => (unit.expanded = false));
            this.selectUnit(
              this.units.filter(
                (unit) => unit.unit_id == feature.get('unit_id')
              )[0]
            );
          }
        },
        150,
        false,
        this
      )
    );
  }

  selectSensor(sensor) {
    this.sensorsSelected.forEach((s) => (s.checked = false));
    sensor.checked = true;
    this.sensorsSelected = [sensor];
    this.sensorIdsSelected = [sensor.sensor_id];
  }

  toggleSensor(sensor) {
    if (sensor.checked) {
      this.sensorsSelected.push(sensor);
      this.sensorIdsSelected.push(sensor.sensor_id);
    } else {
      this.sensorsSelected.splice(this.sensorsSelected.indexOf(sensor), 1);
      this.sensorIdsSelected.splice(
        this.sensorIdsSelected.indexOf(sensor.sensor_id),
        1
      );
    }
  }

  selectUnit(unit) {
    this.unit = unit;
    unit.expanded = !unit.expanded;
    this.selectSensor(unit.sensors[0]);
    if (
      !this.HsLayoutService.contentWrapper.querySelector(
        '.hs-sensor-unit-dialog'
      )
    ) {
      const dir = 'hs.sensors.unit-dialog';
      const html = `<${dir} unit="sensorsService.unit"></${dir}>`;
      const element = angular.element(html)[0];
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(element);
      this.$compile(element)(this.$rootScope.$new());
    } else {
      this.unitDialogVisible = true;
    }
    this.$timeout((_) => {
      if (angular.isUndefined(this.currentInterval)) {
        this.currentInterval = {amount: 1, unit: 'days'};
      }
      this.getObservationHistory(this.unit, this.currentInterval).then((_) =>
        this.createChart(this.unit)
      );
    }, 0);
    this.HsMapService.map
      .getView()
      .fit(unit.feature.getGeometry(), {maxZoom: 16});
  }

  createLayer() {
    this.layer = new VectorLayer({
      title: 'Sensor units',
      synchronize: false,
      editor: {
        editable: false,
      },
      style: function (feature) {
        labelStyle.getText().setText(feature.get('name'));
        return bookmarkStyle;
      },
      source: new VectorSource({}),
    });
    this.HsMapService.map.addLayer(this.layer);
  }

  /**
   * @memberof HsSensorsService
   * @function getUnits
   * @description Get list of units from Senslog backend
   */
  getUnits() {
    if (this.layer === null) {
      this.createLayer();
    }
    const url = this.HsUtilsService.proxify(
      `${this.endpoint.url}/senslog-lite/rest/unit`
    );
    this.$http
      .get(url, {
        params: {
          user_id: this.endpoint.user_id,
        },
      })
      .then(
        (response) => {
          this.units = response.data;
          const features = this.units
            .filter((unit) => unit.unit_position && unit.unit_position.asWKT)
            .map((unit) => {
              const format = new WKT();
              const feature = format.readFeature(unit.unit_position.asWKT, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
              });
              feature.set('name', unit.description);
              feature.set('unit_id', unit.unit_id);
              unit.feature = feature;
              return feature;
            });
          this.layer.getSource().addFeatures(features);
          this.fillLastObservations();
          this.units.forEach((unit) => {
            unit.sensorTypes = unit.sensors.map((s) => {
              return {name: s.sensor_type};
            });
            unit.sensorTypes = this.HsUtilsService.removeDuplicates(
              unit.sensorTypes,
              'name'
            );
            unit.sensorTypes.map(
              (st) =>
                (st.sensors = unit.sensors.filter(
                  (s) => s.sensor_type == st.name
                ))
            );
          });
          this.$interval(this.fillLastObservations.bind(this), 60000);
        },
        (err) => {}
      );
  }

  fillLastObservations() {
    this.$http
      .get(
        this.HsUtilsService.proxify(
          `${this.endpoint.url}/senslog1/SensorService`
        ),
        {
          params: {
            Operation: 'GetLastObservations',
            group: this.endpoint.group,
            user: this.endpoint.user,
          },
        }
      )
      .then((response) => {
        const sensorValues = {};
        response.data.forEach((sv) => {
          sensorValues[sv.sensorId] = {
            value: sv.observedValue,
            timestamp: moment(sv.timeStamp).format('DD.MM.YYYY HH:mm'),
          };
        });
        this.units.forEach((unit) => {
          unit.sensors.forEach((sensor) => {
            this.sensorById[sensor.sensor_id] = sensor;
            if (sensorValues[sensor.sensor_id]) {
              sensor.lastObservationValue =
                sensorValues[sensor.sensor_id].value;
              sensor.lastObservationTimestamp =
                sensorValues[sensor.sensor_id].timestamp;
            }
          });
        });
      });
  }

  getTimeForInterval(interval) {
    if (angular.isDefined(interval.fromTime)) {
      return moment(interval.fromTime);
    } else {
      return moment().subtract(interval.amount, interval.unit);
    }
  }

  /**
   * @memberof HsSensorsService
   * @function getObservationHistory
   * @param {object} unit Object containing
   * {description, is_mobile, sensors, unit_id, unit_type}
   * @param {object} interval Object {amount, unit}. Used to substract time
   * from current time, like 6 months before now
   * @description Gets list of observations in a given time frame for all
   * the sensors on a sensor unit (meteostation).
   * @returns {Promise} Promise which resolves when observation history data is received
   */
  getObservationHistory(unit, interval) {
    return new Promise((resolve, reject) => {
      const url = this.HsUtilsService.proxify(
        `${this.endpoint.url}/senslog-lite/rest/observation`
      );
      const time = this.getTimeForInterval(interval);
      const from_time = `${time.format('YYYY-MM-DD')} ${time.format(
        'HH:mm:ssZ'
      )}`;
      interval.loading = true;
      this.$http
        .get(url, {
          params: {
            user_id: this.endpoint.user_id,
            unit_id: unit.unit_id,
            from_time,
          },
        })
        .then(
          (response) => {
            interval.loading = false;
            this.observations = response.data;
            resolve();
          },
          (err) => {
            reject(err);
          }
        )
        .catch((e) => {
          reject(e);
        });
    });
  }

  /**
   * @memberof HsSensorsService
   * @function createChart
   * @param {object} unit Unit description
   * @description Create vega chart definition and use it in vegaEmbed
   * chart library. Observations for a specific unit from Senslog come
   * in a hierarchy, where 1st level contains object with timestamp and
   * for each timestamp there exist multiple sensor observations for
   * varying count of sensors. This nested list is flatened to simple
   * array of objects with {sensor_id, timestamp, value, sensor_name}
   */
  createChart(unit) {
    let sensorDesc = unit.sensors.filter(
      (s) => this.sensorIdsSelected.indexOf(s.sensor_id) > -1
    );
    if (sensorDesc.length > 0) {
      sensorDesc = sensorDesc[0];
    }
    const observations = this.observations.reduce(
      (acc, val) =>
        acc.concat(
          val.sensors
            .filter((s) => this.sensorIdsSelected.indexOf(s.sensor_id) > -1)
            .map((s) => {
              const time = moment(val.time_stamp);
              s.sensor_name = this.sensorById[s.sensor_id].sensor_name;
              s.time = time.format('DD.MM.YYYY HH:mm');
              s.time_stamp = time.toDate();
              return s;
            })
        ),
      []
    );
    observations.sort((a, b) => {
      if (a.time_stamp > b.time_stamp) {
        return 1;
      }
      if (b.time_stamp > a.time_stamp) {
        return -1;
      }
      return 0;
    });
    //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
    const chartData = {
      '$schema': 'https://vega.github.io/schema/vega-lite/v4.0.2.json',
      'HsConfig': {
        'mark': {
          'tooltip': null,
        },
      },
      'width':
        this.HsLayoutService.dialogAreaElement.querySelector('.hs-chartplace')
          .parentElement.offsetWidth - 40,
      'autosize': {
        'type': 'fit',
        'contains': 'padding',
      },
      'data': {
        'name': 'data-062c25e80e0ff23df3803082d5c6f7e7',
      },
      'datasets': {
        'data-062c25e80e0ff23df3803082d5c6f7e7': observations,
      },
      'encoding': {
        'color': {
          'field': 'sensor_name',
          'legend': {
            'title': 'Sensor',
          },
          'type': 'nominal',
          'sort': 'sensor_id',
        },
        'x': {
          'axis': {
            'title': 'Timestamp',
            'labelOverlap': true,
          },
          'field': 'time_stamp',
          'sort': false,
          'type': 'temporal',
        },
        'y': {
          'axis': {
            'title': `${sensorDesc.phenomenon_name} ${sensorDesc.uom}`,
          },
          'field': 'value',
          'type': 'quantitative',
        },
      },
      'mark': {'type': 'line', 'tooltip': {'content': 'data'}},
      'selection': {
        'selector016': {
          'bind': 'scales',
          'encodings': ['x', 'y'],
          'type': 'interval',
        },
      },
    };
    try {
      vegaEmbed(
        this.HsLayoutService.dialogAreaElement.querySelector('.hs-chartplace'),
        chartData
      );
    } catch (ex) {
      this.$log.warn('Could not create vega chart:', ex);
    }
  }
}

const labelStyle = new Style({
  geometry: function (feature) {
    let geometry = feature.getGeometry();
    if (geometry.getType() == 'MultiPolygon') {
      // Only render label for the widest polygon of a multipolygon
      const polygons = geometry.getPolygons();
      let widest = 0;
      for (let i = 0, ii = polygons.length; i < ii; ++i) {
        const polygon = polygons[i];
        const width = getWidth(polygon.getExtent());
        if (width > widest) {
          widest = width;
          geometry = polygon;
        }
      }
    }
    return geometry;
  },
  text: new Text({
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3,
    }),
  }),
});

const bookmarkStyle = [
  new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#e49905',
      width: 2,
    }),
    image: new Icon({
      src: require('../../components/styles/img/svg/wifi8.svg'),
      crossOrigin: 'anonymous',
      anchor: [0.5, 1],
    }),
  }),
  labelStyle,
];
