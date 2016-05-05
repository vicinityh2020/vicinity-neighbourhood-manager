var services = angular.module('VicinityManagerApp.services').
factory('searchAPIService', function($http) {
  
  var searchAPI = {};
   
  //simple search filter
  searchAPI.search = function(filter) {
    return $http.get('http://localhost:3000/search?filter=' + filter);
  }
  
  return searchAPI;
});