angular.module('VicinityManagerApp.controllers')
.controller('dPdescriptionController',
function ($scope, $window, $stateParams, itemsAPIService, Notification) {

  $scope.loaded = false;
  $scope.isMyDevice = false;
  $scope.device = {};
  $scope.devInfo = {};
  $scope.devEnabled = '';


  initData();

  function initData(){
    itemsAPIService.getItemWithAdd($stateParams.deviceId)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );
    }

    function updateScopeAttributes(response){
        $scope.device = response.data.message;
        $scope.devInfo = response.data.message.info;
        $scope.devEnabled = ($scope.device.status === 'enabled');
        $scope.isMyDevice = ($window.sessionStorage.companyAccountId.toString() === response.data.message.hasAdministrator[0]._id.toString());
    }
});
