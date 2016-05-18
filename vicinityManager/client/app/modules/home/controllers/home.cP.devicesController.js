angular.module('VicinityManagerApp.controllers')
.controller('cPdevicesController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

$scope.devices = [];
$scope.friends = [];

  userAccountAPIService.getMyDevices($stateParams.companyAccountId).success(function (data) {
       $scope.devices = data.message;
  });

  userAccountAPIService.getFriends($stateParams.companyAccountId).success(function (data) {
    $scope.friends = data.message;
  });

  for (fr in $scope.friends){
      if ($scope.friends[fr]._id.toString()===$window.sessionStorage.companyAccountId.toString()){
        isFriend = true;
      }
  };

  $scope.searchFilter1 = function (result) {

    var keyword=new RegExp($window.sessionStorage.companyAccountId.toString());
    var keyword3=new RegExp("3");
    var keyword4=new RegExp("4");
    var isFriend= false;


    return (keyword.test(result.hasAccess) || keyword4.test(result.accessLevel) || (keyword3.test(result.accessLevel) && isFriend));
  };

  
});
