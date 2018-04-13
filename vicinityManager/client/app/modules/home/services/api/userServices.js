'use strict';
var services = angular.module('VicinityManagerApp.services').
factory('userAPIService', ['$http', 'configuration', '$window', function($http, configuration, $window){

  var userAPI = {};

  userAPI.editInfoAboutUser = function(id, data) {
    return $http.put(configuration.apiUrl +'/user/' + id, data);
  };

  userAPI.getUser = function(id) {
    return $http.get(configuration.apiUrl +'/user/' + id);
  };

  userAPI.getAll = function(othercid) {
    var mycid = $window.sessionStorage.companyAccountId.toString();
    return $http.get(configuration.apiUrl +'/user/all/' + othercid + '?mycid=' + mycid);
  };

  userAPI.deleteUser = function(id) {
    var data = {};
    data.userMail = $window.sessionStorage.username;
    return $http.post(configuration.apiUrl + '/user/delete/' + id, data);
  };

  return userAPI;
}]);
