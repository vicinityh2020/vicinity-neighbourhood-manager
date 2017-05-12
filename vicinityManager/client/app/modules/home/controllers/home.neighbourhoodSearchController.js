angular.module('VicinityManagerApp.controllers').
  controller('neighbourhoodSearchController', function ($scope, searchAPIService, userAccountAPIService, $stateParams) {
    // $scope.resultsList = [];

    $scope.devs=[];
    $scope.cancelRequest= false;
    $scope.cancelAccess= true;
    $scope.onlyPrivateDevices = false;
    $scope.note="Access approved for friends";

    userAccountAPIService.getNeighbourhood($window.sessionStorage.companyAccountId)
      .then(
        function successCallback(response) {
          $scope.devs = reponse.data.message;
          var i=0;
          for (dev in $scope.devs){
            // updateDev($scope.devs[dev]);
            // itemsAPIService.getItemWithAdd($scope.devs[dev]._id).success(updateScopeAttributes2);     //postupne updatne vsetky devices
            if ($scope.devs[dev].accessLevel > 1){
              i++;
            };
          };
          if (i == 0){
            $scope.onlyPrivateDevices = true;
          }else{
            $scope.onlyPrivateDevices = false;
          };
        },
        function errorCallback(response){}
      );

    $scope.searchFilter = function (result) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return !$stateParams.searchTerm };

      // $scope.searchFilter = function (result) {
      //   var keyword = new RegExp($stateParams.searchTerm, 'i');
      //
      //   return !$stateParams.searchTerm || keyword.test(result.hasAdministrator[0].organisation) || keyword.test(result.electricity.location) || keyword.test(result.electricity.serial_number) || keyword.test(result.name);
      // };

    // userAccountAPIService.getUserAccounts().success(function (response) {
    //   var results = response.message;
    //   $scope.resultsList = results;
    // });
  });
