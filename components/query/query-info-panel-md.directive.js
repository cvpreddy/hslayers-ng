/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/infopanelmd.html'),
    // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
  };
}
