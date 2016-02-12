angular.module('VicinityManagerApp.controllers').
controller('driversController', function($scope, ergastAPIservice) {
    $scope.nameFilter = null;
    $scope.driversList = [];
  
    $scope.searchFilter = function(driver) {
      var keyword = new RegExp($scope.nameFilter, 'i');
      
      return !$scope.nameFilter || keyword.test(driver.Driver.givenName) || keyword.test(driver.Driver.familyName);
    }
  
    ergastAPIservice.getDrivers().success(function (response) {
      var standingsLists = response.MRData.StandingsTable.StandingsLists;
      var standing = standingsLists[0];
      $scope.driversList = standing.DriverStandings;                                      
    });
}).

controller('driverController', function($scope, $routeParams, ergastAPIservice) {
  $scope.id = $routeParams.id;
  $scope.races = [];
  $scope.driver = null;
  
  ergastAPIservice.getDriverDetails($scope.id).success(function (response) {
    $scope.driver = response.MRData.StandingsTable.StandingsLists[0].DriverStandings[0];
  });
  
  ergastAPIservice.getDriverRaces($scope.id).success(function (response) {
    $scope.races = response.MRData.RaceTable.Races;
  });
}).

controller('sensorsElectroController', function($scope, argastAPIservice) {
  
}).

controller('sensorsHeatingController', function($scope, argastAPIservice) {
  
}).

controller('sensorTemperatureController', function($scope, argastAPIservice) {
  
}).

controller('parkingSlotsController', function($scope, argastAPIservice) {
  
});