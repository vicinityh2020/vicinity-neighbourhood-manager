'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var itemsAPI = {};

  /*
  Modify item
  Delete item
  Get one item
  Get my items (Organisation items) - Offline filter in org profile to remove what I should not see
  Get all items I can see, based on restrictive filter (0 most to 7 less restrictive)
  */
  itemsAPI.putOne = function(data) {
    return $http.put(configuration.apiUrl +'/items', data);
  };

  itemsAPI.deleteItem = function(id) {
    return $http.delete(configuration.apiUrl + '/items/delete/' + id);
  };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get(configuration.apiUrl + '/items/' + id);
  };

  itemsAPI.getMyItems = function(id, filter, offset, cid) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/myItems?type=' + filter + '&offset=' + offset + '&cid=' + cid);
  };

  itemsAPI.getAllItems = function(id, filter, offset, filterNumber, filterOntology) {
    var payload = { type: filter, offset: offset, filterNumber: filterNumber, filterOntology: filterOntology};
    return $http.post(configuration.apiUrl + '/items/' + id + '/organisation/allItems', payload);
  };

  itemsAPI.getUserItems = function(reqId, reqCid, type){
    var payload = { reqId: reqId, reqCid: reqCid, type: type};
    return $http.post(configuration.apiUrl + '/items/user', payload);
  };

  /*
  Contract management
  */
  itemsAPI.getContracts = function(id){
    return $http.get(configuration.apiUrl + '/items/contract/' + id);
  };

  itemsAPI.postContract = function(payload){
    return $http.post(configuration.apiUrl + '/items/contract', payload);
  };

  itemsAPI.acceptContract = function(id, payload){
    return $http.put(configuration.apiUrl + '/items/contract/' + id + '/accept', payload);
  };

  itemsAPI.modifyContract = function(id, payload){
    return $http.put(configuration.apiUrl + '/items/contract/' + id + '/modify', payload);
  };

  itemsAPI.removeContract = function(id){
    return $http.delete(configuration.apiUrl + '/items/contract/' + id);
  };

  return itemsAPI;

}]);
