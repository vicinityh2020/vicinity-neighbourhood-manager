angular.module('VicinityManagerApp.controllers')
.controller('cPfriendsController',
function ($scope, $stateParams, $interval, userAccountAPIService, $window) {
  // ====== Triggers window resize to avoid bug =======
      $(window).trigger('resize');
        $interval(waitTillLoad, 100, 1);
        function waitTillLoad(){
          $(window).trigger('resize');
        }
  $scope.friends = [];
  $scope.loaded = false;

  userAccountAPIService.getFriends($stateParams.companyAccountId).then(
    function successCallback(response) {
    $scope.friends = response.data.message;
    $scope.loaded = true;
    },
    function errorCallback(response){}
  );

});
