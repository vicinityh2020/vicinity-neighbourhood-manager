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
  itemsAPI.putOne = function(id, data) {
    data.userMail = $window.sessionStorage.username;
    data.userId = $window.sessionStorage.userAccountId;
    return $http.put(configuration.apiUrl +'/items/' + id, data);
  };

  itemsAPI.deleteItem = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl + '/items/delete/' + id, data);
  };

  itemsAPI.getItemWithAdd = function(id){
    var cid = $window.sessionStorage.companyAccountId;
    return $http.get(configuration.apiUrl + '/items/' + id + '?cid=' + cid);
  };

  itemsAPI.getMyItems = function(id, filter, offset, cid) {
    return $http.get(configuration.apiUrl + '/items/' + id + '/organisation/myItems?type=' + filter + '&offset=' + offset + '&cid=' + cid);
  };

  itemsAPI.getAllItems = function(id, filter, offset, filterNumber, filterOntology) {
    var payload = { type: filter, offset: offset, filterNumber: filterNumber, filterOntology: filterOntology};
    return $http.post(configuration.apiUrl + '/items/' + id + '/organisation/allItems', payload);
  };

  itemsAPI.getUserItems = function(reqId, reqCid, ownCid, type){
    var payload = { reqId: reqId, reqCid: reqCid, ownCid: ownCid, type: type};
    return $http.post(configuration.apiUrl + '/items/user', payload);
  };

  /*
  Contract management
  */

  itemsAPI.postContract = function(payload){
    return $http.post(configuration.apiUrl + '/items/contract', payload);
  };

  return itemsAPI;

}]);
