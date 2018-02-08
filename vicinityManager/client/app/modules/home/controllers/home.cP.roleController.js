'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('cProleController',
function ($scope, $window, commonHelpers, $stateParams, userAPIService, Notification) {

// Initialize variables ========
// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.userAccounts = [];
  $scope.loaded = false;
  $scope.loadedPage = false;
  $scope.selectedUser = {};
  $scope.editing = false;
  $scope.newRoles = [];
  $scope.companyId = $stateParams.companyAccountId;
  $scope.rev = false; // Initial sorting set to alphabetical

  $scope.myInit = function(){
  userAPIService.getAll($stateParams.companyAccountId)
    .then(
      function successCallback(response){
        $scope.userAccounts = response.data.message;
        $scope.loadedPage = true;
      },
      function errorCallback(response){}
    );
  };

  $scope.myInit();

// Functions =======

    $scope.updateUserInfo = function(data){
      userAPIService.editInfoAboutUser($scope.selectedUser._id,data)
        .then(
          function successCallback(response){
            $scope.myInit();
          },
            function errorCallback(){Notification.error("Problem updating user profile");
          }
        );
      };

// Initialize & onChange Select2 Elements ==============

    $(".select2").select2({
      allowClear: true,
      closeOnSelect: false
    });

    $(".select2").change(function() {
      var keyword = new RegExp('devOps');
      if(keyword.test($scope.selectedUser.authentication.principalRoles)){
        $scope.newRoles = ['user','devOps'];
      }else{
        $scope.newRoles = ['user'];
      }
      if (this.selectedOptions && this.selectedOptions[0]){
        for(var i = 0; i < this.selectedOptions.length; i++){
          $scope.newRoles.push(this.selectedOptions[i].innerHTML.toString());
        }
      }
    });

    // Button functions ===================

    $scope.startUpdate = function(i){
      $scope.selectedUser = i;
      $(".select2").val($scope.selectedUser.authentication.principalRoles).trigger('change'); // Clear selection
      $(".select2").trigger('change');
      $scope.editing = true;
      $scope.loaded = true;
    };

    $scope.updateRoles = function(){
      if($scope.oneAdmin()){
        var query = {'authentication.principalRoles':$scope.newRoles};
        $scope.updateUserInfo(query);
        $scope.cancelChanges();
        Notification.success("User role modified");
      }else{
        Notification.warning("There must be at least one administrator");
        $scope.cancelChanges();
      }
    };

    $scope.cancelChanges = function(){
      $scope.newRoles = [];
      $scope.selectedUser = {};
      $scope.editing = false;
      $scope.loaded = false;
    };

    $scope.deleteUser = function(i){
      $scope.selectedUser = i;
      if($scope.oneAdmin()){
        if(confirm('Are you sure?')){  // TODO
          $scope.selectedUser = i;
          userAPIService.deleteUser($scope.selectedUser._id)
          .then(
            function(response){
              Notification.success("User removed");
              $scope.myInit();
            },
            function(err){Notification.warning("Error: " + err);}
          );
        }
      }else{
        Notification.warning("There must be at least one administrator");
        $scope.cancelChanges();
      }
    };

    // Ensure at least one admin in company
    $scope.oneAdmin = function(){
      var keyword = new RegExp('administrator');
      var cont = 0;
      // Find out if removing admin role
      if(keyword.test($scope.selectedUser.authentication.principalRoles) && !keyword.test($scope.newRoles)){
        for(var i = 0; i < $scope.userAccounts.length; i++){
          if(keyword.test($scope.userAccounts[i].id.authentication.principalRoles)){
            cont++;
          }
        }
        if(cont <= 1){
          return false;
        }else{
          return true;
        }
      } else {
        return true;
      }
    };

    // Sorting

    $scope.onSort = function(order){
      $scope.rev = order;
    };


});
