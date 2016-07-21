var services = angular.module('VicinityManagerApp.services').
factory('invitationsAPIService', ['$http', 'configuration', function($http, configuration){

  var invitationsAPI = {};

  invitationsAPI.getOne = function(id){
    return $http.get(configuration.apiUrl +'/invitations/' + id );
  };

  invitationsAPI.getAll = function(){
    return $http.get(configuration.apiUrl +'/invitations/');
  };

  invitationsAPI.postOne = function(data) {
    return $http.post(configuration.apiUrl +'/invitations/', data);
  };

  // itemsAPI.addFriendToHasAccess = function(id){
  //   return $http.put('http://localhost:3000/items/' + id '/hasAccess');
  // };


  return invitationsAPI;
}]);
