'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('serviceProfileController',
function ($scope, $window, $state, $stateParams, $location, tokenDecoder, commonHelpers, itemsAPIService, Notification) {

  $scope.locationPrefix = $location.path();

// Initialize variables and data =====================
// ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.itemEnabled = false;
  $scope.showInput = false;
  $scope.isMyItem = false;
  $scope.isMyOrgItem = false;
  $scope.imServiceProvider = false;
  $scope.loaded = false;
  $scope.item = {};
  $scope.contracted = false;

  initData();

  function initData(){
    itemsAPIService.getItemWithAdd($stateParams.serviceId)
      .then(
        function successCallback(response){
          $scope.isMyItem = false;
          $scope.isMyOrgItem = false;
          $scope.loaded = false;
          updateScopeAttributes(response);
          $scope.loaded = true;
        },
        function errorCallback(response){
          Notification.error('Problem fetching data');
        }
      );
      var payload = tokenDecoder.deToken();
      for(var i in payload.roles){
        if(payload.roles[i] === 'service provider'){
          $scope.imServiceProvider = true;
        }
      }
    }

    function updateScopeAttributes(response){
        $scope.item = response.data.message[0];
        $scope.name = $scope.item.cid.id.name;
        $scope.item.uid = $scope.item.uid === undefined ? {} : $scope.item.uid; // Case device disabled
        $scope.itemEnabled = ($scope.item.status === 'enabled');

        var aux = ["Private", "Partners with Data Under Request", "Public with Data Under Request"];
        $scope.ALcaption = aux[$scope.item.accessLevel];

        if($scope.itemEnabled) $scope.isMyItem = ($window.sessionStorage.userAccountId.toString() === $scope.item.uid.id.toString());
        $scope.isMyOrgItem = ($window.sessionStorage.companyAccountId.toString() === $scope.item.cid.id._id.toString());

        $scope.nContracts = 0;
        $scope.contracted = false;
        for(var i = 0; i <  $scope.item.hasContracts.length; i++){
          if($scope.item.hasContracts[i].contractingUser.toString() === $window.sessionStorage.userAccountId.toString()){
            $scope.contracted = true;
            $scope.nContracts = $scope.nContracts + 1;
          }
        }
      }

    $scope.changeStatus = function(){
      var query = {};
      if($scope.item.status === 'enabled'){
        query = {
          "status":'disabled',
          "o_id": $scope.item._id,
          "oid": $scope.item.oid,
          "typeOfItem": "service"
        };
      }else{
        query = {
          "status":'enabled',
          "o_id": $scope.item._id,
          "oid": $scope.item.oid,
          "typeOfItem": "service"
        };
      }
      itemsAPIService.putOne(query)
        .then(
          function successCallback(response){
            if(response.data.success){
              Notification.success('Service status updated!!');
              initData();
            } else {
              Notification.warning('Unauthorized');
            }
          },
          function errorCallback(response){
          }
        );
    };

  $scope.deleteItem = function(){
    if(confirm('Are you sure?')){
      itemsAPIService.deleteItem($scope.item.oid)
        .then(
          function successCallback(response){
            Notification.success('service deleted');
            $state.go("root.main.allServices");
          },
          function errorCallback(response){
            Notification.error('Problem deleting item');
          }
        );
      }
    };

// HIDE && SHOW DOM =========================

  //Access Level
  $('a#accessEdit').show();
  $('a#accessSave').hide();
  $('a#accessCancel').hide();
  $('select#editAccessName').hide();
  $('p#accessName').show();

  $scope.changeToInput = function () {
    $('a#accessEdit').hide();
    $('p#accessName').hide();
    $('select#editAccessName').show();
    $('a#accessSave').fadeIn('slow');
    $('a#accessCancel').fadeIn('slow');
  };

  $scope.backToEdit = function () {
    $('a#accessCancel').fadeOut('slow');
    $('a#accessSave').fadeOut('slow');
    $('select#editAccessName').fadeOut('slow');
    setTimeout(function() {
      $('a#accessEdit').fadeIn('fast');
      $('p#accessName').fadeIn('fast');
    }, 600);
  };

  $scope.saveNewAccess = function () {
    if (Number($('select#editAccessName').val()) !== 0){
        itemsAPIService.putOne(
            {accessLevel: $('select#editAccessName').val() - 1,
            typeOfItem: "service",
            o_id: $scope.item._id,
            oid: $scope.item.oid,
            uid: $scope.owner,
            oldAccessLevel: $scope.item.accessLevel })
          .then(
            function successCallback(response){
              if(response.data.success){
                Notification.success("Access level updated");
              } else {
                Notification.warning("User access level is too low...");
              }
              initData();
              $scope.backToEdit();
            }
          )
          .catch(function(err){
            Notification.error(err);
          });
        }
      };

  // Serial Number

  // Location

// Load picture mgmt =============================

var base64String= "";

$("input#input1").on('change',function(evt) {

  var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

  if (FileReader && files && files.length) {
        var fr = new FileReader();
        fr.onload = function () {
            // $("img#pic").src = fr.result;
            $("img#pic").prop("src",fr.result);
            base64String = fr.result;
        };
        fr.readAsDataURL(files[0]);
    }else{
        // fallback -- perhaps submit the input to an iframe and temporarily store
        // them on the server until the user's session ends.
    }
});

$scope.showLoadPic = function(){
  $scope.showInput = true;
  $('#editCancel1').fadeIn('slow');
  $('#editUpload2').fadeIn('slow');
  $('#input1').fadeIn('slow');
};

$scope.cancelLoadPic = function(){
  $('#editCancel1').fadeOut('slow');
  $('#editUpload2').fadeOut('slow');
  $('#input1').fadeOut('slow');
  $('img#pic').fadeOut('slow');
  setTimeout(function() {
    $("img#pic").prop("src",$scope.item.avatar);
    $('img#pic').fadeIn('slow');
 }, 600);
};

$scope.uploadPic = function(){
  itemsAPIService.putOne({o_id:$scope.item._id, avatar: base64String, typeOfItem: "service", oid: $scope.item.oid})
    .then(
      function successCallback(response){
        itemsAPIService.getItemWithAdd($stateParams.serviceId)
          .then(
            function successCallback(response){
              if(response.data.success){
                Notification.success('Service status updated!!');
                $scope.item = response.data.message;
                $('#editCancel1').fadeOut('slow');
                $('#editUpload2').fadeOut('slow');
                $('#input1').fadeOut('slow');
                $('img#pic').fadeOut('slow');
                setTimeout(function() {
                  $("img#pic").prop("src",$scope.item.avatar);
                  $('img#pic').fadeIn('slow');
               }, 600);
             } else {
               Notification.warning('Unauthorized');
             }
           },
           function errorCallback(response){
             Notification.error(response);
           }
         );
      }
    );
  };
});
