angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, searchAPIService, userAccountAPIService, userAPIService, $stateParams, $window) {
    $scope.resultsList = [];
    $scope.loaded = false;
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.search = $stateParams.searchTerm;


    $scope.searchFilter = function (result) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return $stateParams.searchTerm && keyword.test(result.organisation) ;   // || keyword.test(result.accountOf.occupation)
    };

    // var promise = $timeout(emptySearch, 1000);
    //
    // $scope.$on('$locationChangeStart', function(){
    //     $timeout.cancel(promise);
    // });
    //
    // function emptySearch(){
    //   $stateParams.searchTerm = "";
    // }

    userAccountAPIService.getUserAccounts()
      .then(
        function successCallback(response) {
          var results = response.data.message;
          $scope.resultsList = results;
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );

    $scope.searchFilter2 = function (result2) {
      var keyword = new RegExp($stateParams.searchTerm, 'i');

      return $stateParams.searchTerm && keyword.test(result2.name) ;   // || keyword.test(result.accountOf.occupation)
    };

    userAPIService.getAll()
      .then(
        function successCallback(response) {   //users not userAccounts
          var results2 = response.data.message;
          $scope.resultsList2 = results2;
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );


  });
