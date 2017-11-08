'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', ['$http', 'configuration', function($http, configuration){

  var itemsAPI = {};

  /*
  Process/change/request access to items
  */
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

  /*
  Modify item
  Delete item
  Get one item
  Get my items (Organisation items) - Offline filter in org profile to remove what I should not see
  TODO: Filter out what I cannot see in backEnd (getMyItems)
  Get all items I can see, based on restrictive filter (0 most to 7 less restrictive)
  */
  itemsAPI.putOne = function(id, data) {
    return $http.put(configuration.apiUrl +'/items/' + id, data);
  };

  itemsAPI.deleteItem = function(id) {
    return $http.delete(configuration.apiUrl + '/items/' + id);
  };

  itemsAPI.getItemWithAdd = function(id){
    return $http.get(configuration.apiUrl +'/items/' + id );
  };

  itemsAPI.getMyItems = function(id, filter, offset, cid) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/myItems?type=' + filter + '&offset=' + offset + '&cid=' + cid);
  };

  itemsAPI.getAllItems = function(id, filter, offset, filterNumber) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/allItems?type=' + filter + '&offset=' + offset + '&filterNumber=' + filterNumber);
  };

  return itemsAPI;

}]);
