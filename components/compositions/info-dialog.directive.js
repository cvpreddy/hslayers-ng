export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/dialog_info.html'),
      link: function (scope, element, attrs) {
        scope.infoModalVisible = true;
      },
    };
  },
];
