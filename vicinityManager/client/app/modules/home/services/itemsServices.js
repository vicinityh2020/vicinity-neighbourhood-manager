var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', function($http){

  var itemsAPI = {};

  itemsAPI.processDeviceAccess = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access');
  };

  itemsAPI.cancelDeviceRequest = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access/cancelRequest');
  };

  itemsAPI.acceptDeviceRequest = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access/accept');
  };

  itemsAPI.rejectDeviceRequest = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access/reject');
  };

  itemsAPI.cancelAccess3 = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access/cancel');
  };

  itemsAPI.getAccess3 = function(id) {
    return $http.put('http://localhost:3000/items/' + id + '/access/get');
  };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get('http://localhost:3000/items/' + id );
  };

  // itemsAPI.addFriendToHasAccess = function(id){
  //   return $http.put('http://localhost:3000/items/' + id '/hasAccess');
  // };


  return itemsAPI;
});
