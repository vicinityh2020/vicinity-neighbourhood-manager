var services = angular.module('VicinityManagerApp.services').
factory('notificationsAPIService', ['$http', 'configuration', function($http, configuration){

  var notificationsAPI = {};

  notificationsAPI.getAll = function() {
    return $http.get(configuration.apiUrl +'/notifications');
  };

  notificationsAPI.changeIsUnreadToFalse = function(id) {
    return $http.put(configuration.apiUrl +'/notifications/' + id + '/changeIsUnreadToFalse');
  };



  return notificationsAPI;
}]);
