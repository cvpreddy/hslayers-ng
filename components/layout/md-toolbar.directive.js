/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
	  template: HsConfig.directiveTemplates['md-toolbar'] ||
		require('./partials/toolbar.html'),
  };
}
