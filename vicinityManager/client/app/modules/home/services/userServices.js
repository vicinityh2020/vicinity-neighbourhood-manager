var services = angular.module('VicinityManagerApp.services').
factory('userAPIService', ['$http', 'configuration', function($http, configuration){

  var userAPI = {};


  userAPI.editInfoAboutUser = function(id, data) {
    return $http.put(configuration.apiUrl +'/user/' + id, data);
  };

  userAPI.getUser = function(id) {
    return $http.get(configuration.apiUrl +'/user/' + id);
  };

  // userAPI.newUserProfile = function () {
  //   return $http.post(configuration.apiUrl +'/user/');
  // };
  //
  // userAPI.deleteUser = function(id) {
  //   return $http.delete(configuration.apiUrl +'/user/' + id + '/friendship');
  // };

  return userAPI;
}]);
