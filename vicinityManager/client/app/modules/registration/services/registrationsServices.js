var services = angular.module('VicinityManagerApp.services').
factory('registrationsAPIService', ['$http', 'configuration', function($http, configuration){

  var registrationsAPI = {};

  registrationsAPI.getOne = function(id){
    return $http.get(configuration.apiUrl +'/registrations/' + id );
  };

  registrationsAPI.getAll = function(){
    return $http.get(configuration.apiUrl +'/registrations/');
  };

  registrationsAPI.postOne = function(data) {
    return $http.post(configuration.apiUrl +'/registrations/', data);
  };

  registrationsAPI.putOne = function(id, data) {
    return $http.put(configuration.apiUrl +'/registrations/' + id, data);
  };

  // itemsAPI.addFriendToHasAccess = function(id){
  //   return $http.put('http://localhost:3000/items/' + id '/hasAccess');
  // };


  return registrationsAPI;
}]);
