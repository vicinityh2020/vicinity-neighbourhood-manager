'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('registrationsListService', ['$http', 'configuration', function($http, configuration){

  var registrationsList = {};

  registrationsList.getCompanies = function() {
    return $http.get(configuration.apiUrl + '/registrations');
  };

  return registrationsList;
}]);
