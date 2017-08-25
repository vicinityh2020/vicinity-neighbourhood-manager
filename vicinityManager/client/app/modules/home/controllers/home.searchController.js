'use strict';
angular.module('VicinityManagerApp.controllers').
  controller('searchController', function ($scope, commonHelpers, searchAPIService, userAccountAPIService, itemsAPIService, $stateParams, $window, Notification) {

// OnLoad functions &&  Initialize variables

// ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    $scope.resultsOrganisations = [];
    $scope.resultsUsers = [];
    $scope.resultsItems = [];
    $scope.loaded = false;
    $scope.tempId = "";
    $scope.activeCompanyID = $window.sessionStorage.companyAccountId;
    $scope.search = $stateParams.searchTerm;


    searchAPIService.searchOrganisation($scope.search)
      .then(searchUsers,errorCallback)
      .then(searchFriends,errorCallback)
      .then(searchItems,errorCallback)
      .then(searchFinish,errorCallback);

      function searchUsers(response){
        $scope.resultsOrganisations = response.data.message;
        $scope.loaded1 = true;
        return searchAPIService.searchUser($scope.search);
      }

      function searchFriends(response){
        $scope.resultsUsers = response.data.message;
        $scope.loaded2 = true;
        return userAccountAPIService.getFriends($scope.activeCompanyID);
      }

      function searchItems(response){
        $scope.myFriends = [];
        for(var elem in response.data.message){
          $scope.myFriends.push(response.data.message[elem]._id);
        }
        return searchAPIService.searchItem($scope.activeCompanyID, $scope.search, $scope.myFriends);
      }

      function searchFinish(response){
        $scope.resultsItems = response.data.message;
        $scope.loaded3 = true;
        $scope.loaded = true;
      }

      function errorCallback(err){
        Notification.error('Problem in the search: ' + err);
      }

      // Manage access request functions =====================

         $scope.processMyAccess = function(dev_id) {
           $scope.tempId = dev_id;
           itemsAPIService.processItemAccess(dev_id)
           .then(processingAccess,errorCallback2)
           .then(getItem,errorCallback2);
          };

         $scope.cancelMyRequest = function(dev_id) {
           $scope.tempId = dev_id;
           itemsAPIService.cancelItemRequest(dev_id)
           .then(cancellingRequest,errorCallback2)
           .then(getItem,errorCallback2);
          };

         $scope.cancelMyAccess = function(dev_id) {
           $scope.tempId = dev_id;
           itemsAPIService.cancelItemAccess(dev_id)
           .then(cancellingAccess,errorCallback2)
           .then(getItem,errorCallback2);
         };

      // Callbacks and helpers ===============

         function processingAccess(response){
           if (response.data.message.error) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Access request sent!");
           }
           return itemsAPIService.getItemWithAdd($scope.tempId);
         }

         function cancellingRequest(response){
           if (response.data.message.error) {
               Notification.error("Sending data access request failed!");
           } else {
               Notification.success("Data access request canceled!");
           }
           return itemsAPIService.getItemWithAdd($scope.tempId);
         }

         function cancellingAccess(response){
           if (response.data.message.error) {
               Notification.error("Try for interruption failed!");
           } else {
               Notification.success("Connection interrupted!");
           }
           return itemsAPIService.getItemWithAdd($scope.tempId);
         }

         function getItem(response){
           updateScopeAttributes(response);
           $scope.tempId = "";
         }

        function errorCallback2(err){
          Notification.error("Something went wrong: " + err);
        }

        function updateScopeAttributes(response){
          for (var dev in $scope.resultsItems){
            if ($scope.resultsItems[dev]._id.toString() === response.data.message[0]._id.toString()){
                $scope.resultsItems[dev] = response.data.message[0];
            }
          }
        }


  });
