var services = angular.module('VicinityManagerApp.services').
factory('userAccountAPIService', function($http){
  
  var userAccountAPI = {};
  
  userAccountAPI.getUserAccountProfile = function(id) {
    return $http.get('http://localhost:3000/useraccounts/' + id);
  }
  
  userAccountAPI.getUserAccounts = function(){
    return $http.get('http://localhost:3000/useraccounts');
  }
  
  return userAccountAPI;
});