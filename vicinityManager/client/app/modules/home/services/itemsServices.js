'use strict';
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

  itemsAPI.cancelAccess = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancel');
  };

  // itemsAPI.getAccess = function(id) {
  //   return $http.put(configuration.apiUrl +'/items/' + id + '/access/get');
  // };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get(configuration.apiUrl +'/items/' + id );
  };

  itemsAPI.putOne = function(id, data) {
    return $http.put(configuration.apiUrl +'/items/' + id, data);
  };

  itemsAPI.postOne = function(data) {
    return $http.post(configuration.apiUrl +'/items/', data);
  };

  // TODO test purpuses, remove in final versions
  // itemsAPI.postBulk = function(data) {
  //   return $http.delete(configuration.apiUrl +'/commServer/deleteAgent/' + data);
  // };

  // TODO test purpuses, remove in final versions
  itemsAPI.deleteItem = function(id) {
    return $http.delete(configuration.apiUrl + '/items/' + id);
  };

  itemsAPI.getMyDevices = function(id) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/devices');
  };

  itemsAPI.getNeighbourhood = function(id) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/neighbourhood');
  };

  itemsAPI.getAllDevices = function(id) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/allDevices');
  };

  // itemsAPI.addFriendToHasAccess = function(id){
  //   return $http.put('http://localhost:3000/items/' + id '/hasAccess');
  // };

  return itemsAPI;

}]);
