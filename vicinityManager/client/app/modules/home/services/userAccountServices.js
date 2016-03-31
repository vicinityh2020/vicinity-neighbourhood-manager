var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', function($http){
  
  var userAccountAPI = {};
  
  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get('http://localhost:3000/useraccounts/' + id);
  };
  
  userAccountAPI.getUserAccounts = function(){
    return $http.get('http://localhost:3000/useraccounts');
  };

  userAccountAPI.sendNeighbourRequest = function (id) {
    //return $http.post('http://localhost:3000/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.acceptNeighbourRequest = function(id) {
    //return $http.put('http://localhost:3000/useraccounts/' + id + '/friendship');
  };

  userAccountAPI.rejectNeighbourRequest = function(id) {
    //return $http.delete('http://localhost:3000/useraccounts/' + id + '/friendship');
  }
  return userAccountAPI;
});