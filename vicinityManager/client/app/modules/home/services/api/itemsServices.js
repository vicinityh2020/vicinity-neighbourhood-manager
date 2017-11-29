'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('itemsAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var itemsAPI = {};

  /*
  Process/change/request access to items
  */
  itemsAPI.processItemAccess = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id + '/access', data);
  };

  itemsAPI.cancelItemRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancelRequest', data);
  };

  itemsAPI.acceptItemRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/accept', data);
  };

  itemsAPI.rejectItemRequest = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/reject', data);
  };

  itemsAPI.cancelItemAccess = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id + '/access/cancel', data);
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
    data.userMail = $window.sessionStorage.username;
    return $http.put(configuration.apiUrl +'/items/' + id, data);
  };

  itemsAPI.deleteItem = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl + '/items/delete/' + id, data);
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
