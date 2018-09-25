'use strict';

angular.module('Authentication')
.directive('tos', function() {
  return {
    controller: 'LoginController',
    templateUrl: "modules/authentication/views/templates/tos.html"
  };
})
.directive('modal', function() {
  return {
    controller: 'LoginController',
    templateUrl: "modules/authentication/views/templates/modal.html"
  };
});
