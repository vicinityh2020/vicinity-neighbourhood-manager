'use strict';

angular.module('VicinityManagerApp.version', [
  'VicinityManagerApp.version.interpolate-filter',
  'VicinityManagerApp.version.version-directive'
])

.value('version', '0.1');
