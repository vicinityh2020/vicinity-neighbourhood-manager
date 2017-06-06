angular.module('VicinityManagerApp.controllers')
.controller('cProleController',
function ($scope, $stateParams, userAccountAPIService, userAPIService) {

  $scope.userAccounts = [];
  $scope.loaded = false;
  $scope.loadedPage = false;
  $scope.selectedUser = {};
  $scope.editing = false;
  $scope.newRoles = [];
  $scope.companyId = $stateParams.companyAccountId;
  $scope.rev = false; // Initial sorting set to alphabetical

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.userAccounts = response.data.message.accountOf;
        $scope.loadedPage = true;
      },
      function errorCallback(response){}
    );

    $scope.updateUserInfo = function(data){
      userAPIService.editInfoAboutUser($scope.selectedUser._id,data)
        .then(
          function successCallback(response){
            var aux = [];
            for (i = 0; i < $scope.userAccounts.length; i++){
              if($scope.selectedUser._id !== $scope.userAccounts[i]._id){
                aux.push($scope.userAccounts[i]);
              }
            }
            userAccountAPIService.updateUserAccounts($stateParams.companyAccountId,{accountOf:aux})
              .then(
                function successCallback(response){
                  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
                    .then(
                      function successCallback(response){
                        $scope.userAccounts = response.data.message.accountOf;
                      },
                      function errorCallback(response){}
                    );
                  },
                  function errorCallback(response){}
                );
              },
              function errorCallback(){alert("ERROR")}
            );
          }

    //Initialize & onChange Select2 Elements ==============

    $(".select2").select2({
      allowClear: true,
      closeOnSelect: false
    });

    $( ".select2" ).change(function() {
      var keyword = new RegExp('devOps');
      if(keyword.test($scope.selectedUser.authentication.principalRoles)){
        $scope.newRoles = ['user','devOps'];
      }else{
        $scope.newRoles = ['user'];
      }
      if (this.selectedOptions && this.selectedOptions[0]){
        for(i = 0; i < this.selectedOptions.length; i++){
          $scope.newRoles.push(this.selectedOptions[i].innerHTML.toString());
        }
      }
    });

    // Button functions ===================

    $scope.startUpdate = function(i){
      $scope.selectedUser = i;
      $(".select2").val($scope.selectedUser.authentication.principalRoles).trigger('change'); // Clear selection
      // $(".select2").trigger('change'); // Clear selection
      $scope.editing = true;
      $scope.loaded = true;
    }

    $scope.updateRoles = function(){
      if($scope.oneAdmin()){
        var query = {'authentication.principalRoles':$scope.newRoles};
        $scope.updateUserInfo(query);
        $scope.cancelChanges();
      }
    }

    $scope.cancelChanges = function(){
      $scope.newRoles = [];
      $scope.selectedUser = {};
      $scope.editing = false;
      $scope.loaded = false;
    }

    $scope.deleteUser = function(i){
      if(confirm('Are you sure?')){
        $scope.selectedUser = i;
        var query = {
          avatar: "",
          name: "",
          firstName: "",
          surname: "",
          lastName: "",
          occupation: "",
          location: "",
          email: $scope.selectedUser.email,
          status: 'deleted',
          authentication: {
            password: "",
            principalRoles: []
          }};
        $scope.updateUserInfo(query);
      }
    }

    // Ensure at least one admin in company
    $scope.oneAdmin = function(){
      var keyword = new RegExp('administrator');
      var cont = 0;
      // Find out if removing admin role
      if(keyword.test($scope.selectedUser.authentication.principalRoles) && !(keyword.test($scope.newRoles) === -1)){
        for(i = 0; i < $scope.userAccounts.length; i++){
          if(keyword.test($scope.userAccounts[i].authentication.principalRoles)){
            cont++;
          }
        }
        if(cont <= 1){
          alert("You cannot remove the only admin in the company!");
          return false;
        }else{
          return true;
        }
      } else {
        return true;
      }
    }

    // Sorting

    $scope.onSort = function(order){
      $scope.rev = order;
    }


});
