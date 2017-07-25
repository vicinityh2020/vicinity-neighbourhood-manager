'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', ['$http', 'configuration', function($http, configuration){

  var itemsAPI = {};

  itemsAPI.processItemAccess = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access');
  };

  itemsAPI.cancelItemRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancelRequest');
  };

  itemsAPI.acceptItemRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/accept');
  };

  itemsAPI.rejectItemRequest = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/reject');
  };

  itemsAPI.cancelItemAccess = function(id) {
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancel');
  };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get(configuration.apiUrl +'/items/' + id );
  };

  itemsAPI.putOne = function(id, data) {
    return $http.put(configuration.apiUrl +'/items/' + id, data);
  };

  // TODO test purpuses, remove in final versions
  // itemsAPI.postBulk = function(data) {
  //   return $http.delete(configuration.apiUrl +'/commServer/deleteAgent/' + data);
  // };

  // TODO test purpuses, remove in final versions
  itemsAPI.deleteItem = function(id) {
    return $http.delete(configuration.apiUrl + '/items/' + id);
  };

  itemsAPI.getMyItems = function(id, filter) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/myItems?type=' + filter);
  };

  itemsAPI.getAllItems = function(id, filter) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/allItems?type=' + filter);
  };

  return itemsAPI;

}]);
