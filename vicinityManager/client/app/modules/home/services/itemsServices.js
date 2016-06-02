var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', ['$http', 'configuration', function($http, configuration){

  var itemsAPI = {};

  itemsAPI.processDeviceAccess = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access');
  };

  itemsAPI.cancelDeviceRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancelRequest');
  };

  itemsAPI.acceptDeviceRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/accept');
  };

  itemsAPI.rejectDeviceRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/reject');
  };

  itemsAPI.cancelAccess3 = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancel');
  };

  itemsAPI.getAccess3 = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/get');
  };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get(configuration.apiUrl +'/items/' + id );
  };

  // itemsAPI.addFriendToHasAccess = function(id){
  //   return $http.put('http://localhost:3000/items/' + id '/hasAccess');
  // };


  return itemsAPI;
}]);
