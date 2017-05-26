angular.module('VicinityManagerApp.controllers')
.controller('rPregAdminController',
function ($scope, $window, $stateParams, $location, registrationsAPIService, Notification) {

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
