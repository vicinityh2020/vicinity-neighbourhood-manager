angular.module('VicinityManagerApp.controllers')
.controller('rPregAdminController',
function ($scope, $window, $stateParams, commonHelpers, $location, registrationsAPIService, Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.loaded = false;

    registrationsAPIService.getOne($stateParams.registrationId)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );

    function updateScopeAttributes(response){
        $scope.userName = response.data.message.userName;
        $scope.email = response.data.message.email;
        $scope.occupation = response.data.message.occupation;
    };


});
