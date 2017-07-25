"use strict";
angular.module('VicinityManagerApp.controllers')
.controller('companyProfileController',
function ($scope, $window, $stateParams, $location, $timeout, userAccountAPIService, itemsAPIService, tokenDecoder, AuthenticationService, Notification) {

  $scope.locationPrefix = $location.path();
  // console.log("location:" + $location.path());
  $scope.name = {};
  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.bid = {};
  $scope.companyAccountId = {};
  $scope.isMyProfile = true;
  $scope.imAdmin = false;
  $scope.canSendNeighbourRequest = false;
  $scope.canCancelNeighbourRequest = false;
  $scope.canAnswerNeighbourRequest = false;
  $scope.isNeighbour = false;
  $scope.location = {};
  $scope.badges = {};
  $scope.notes = {};
  $scope.friends = [];
  $scope.users = [];
  $scope.devices = [];
  $scope.services = [];
  $scope.loaded = false;
  $scope.showInput = false;

  // $scope.organisationNew = '';
  $scope.locationNew = "";
  $scope.notesNew = "";
  // $scope.bidNew = "";

  // Initializa DOM elements
  $('p#org1').show();
  $('a#org2').show();
  $('input#org3').hide();
  $('a#org4').hide();
  $('a#org5').hide();
  $('a#loc2').show();
  $('p#loc1').show();
  $('a#loc4').hide();
  $('a#loc5').hide();
  $('input#loc3').hide();
  $('a#not2').show();
  $('p#not1').show();
  $('a#not4').hide();
  $('a#not5').hide();
  $('textarea#not3').hide();
  $('a#bid2').show();
  $('p#bid1').show();
  $('a#bid4').hide();
  $('a#bid5').hide();
  $('input#bid3').hide();

  // TODO Check exact function of below

      var promise = {};

      // When the DOM element is removed from the page,
      // AngularJS will trigger the $destroy event on
      // the scope. Here we cancel our promise.
      $scope.$on('$destroy', function(){
          $timeout.cancel(promise);
      });

      // Refresh scope data every 5 sec
        $scope.intervalFunction = function(){
          promise = $timeout(function() {
            $scope.isMyProfile = ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId);
            $scope.myInit();
            $scope.intervalFunction();
          }, 5000);
        };

        $scope.intervalFunction();

// Get resources & data ================
$scope.myInit = function(){

userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
  .then(
  function successCallback(response){
    updateScopeAttributes(response);
    $scope.loaded = true;
  },
  function errorCallback(response){}
);

itemsAPIService.getMyItems($stateParams.companyAccountId, 'device')
  .then(
    function successCallback(response){
      $scope.devices = response.data.message;
    },
    function errorCallback(response){}
  );

  itemsAPIService.getMyItems($stateParams.companyAccountId, 'service')
    .then(
      function successCallback(response){
        $scope.services = response.data.message;
      },
      function errorCallback(response){}
    );
};

$scope.myInit();

// Check if it is the company profile and if the user is its admin

$scope.isMyProfile = ($window.sessionStorage.companyAccountId === $stateParams.companyAccountId);
var payload = tokenDecoder.deToken();
var keyword = new RegExp('administrator');
$scope.imAdmin = ($scope.isMyProfile && keyword.test(payload.roles));

// Avatar change functions ==============

var base64String = "";

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
    $("img#pic").prop("src",$scope.avatar);
    $('img#pic').fadeIn('slow');
 }, 600);
};

$scope.uploadPic = function(){
    userAccountAPIService.updateUserAccounts($window.sessionStorage.companyAccountId,{avatar: base64String})
    .then(
      function successCallback(response){
        $scope.avatar = response.data.message.avatar;
        $('#editCancel1').fadeOut('slow');
        $('#editUpload2').fadeOut('slow');
        $('#input1').fadeOut('slow');
        $('img#pic').fadeOut('slow');
        setTimeout(function() {
          $("img#pic").prop("src",$scope.avatar);
          $('img#pic').fadeIn('slow');
       }, 600);
      },
      function errorCallback(response){}
    );
};

// Functions Neighbours ==================

    $scope.sendNeighbourRequest = function () {
        var result = userAccountAPIService
            .sendNeighbourRequest($stateParams.companyAccountId)
                .then(
                  function successCallback(response) {
                    if (response.data.error === true) {
                        Notification.error("Sending partnership request failed!");
                    } else {
                        Notification.success("Partnership request sent!");
                    }
                    $scope.onlyRefreshAccount();
                },
                function errorCallback(response){}
              );
    };

    $scope.acceptNeighbourRequest = function () {
        userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error === true) {
                    Notification.error("Partnership request acceptation failed :(");
                } else {
                    Notification.success("Partnership request accepted!");
                }
                $scope.onlyRefreshAccount();
            },
            function errorCallback(response){}
          );
    };

    $scope.rejectNeighbourRequest = function() {
        userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error === true) {
                    Notification.error("Partnership request rejection failed :(");
                } else {
                    Notification.success("Partnership request rejected!");
                }
                $scope.onlyRefreshAccount();
            },
            function errorCallback(response){}
          );
    };

    $scope.cancelNeighbourRequest = function() {
        userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error === true) {
                    Notification.error("Partnership request cancelation failed :(");
                } else {
                    Notification.success("Partnership request canceled!");
                }
                $scope.onlyRefreshAccount();
            },
            function errorCallback(response){}
          );
    };

    $scope.cancelNeighbourship = function() {
        userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
            .then(
              function successCallback(response){
                if (response.data.error === true) {
                    Notification.error("Partnership cancelation failed :(");
                } else {
                    Notification.success("Partnership canceled!");
                }
                $scope.onlyRefreshAccount();
            },
            function errorCallback(response){}
          );
    };

// Refresh $scope =================

  $scope.onlyRefreshAccount = function(){
    userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
        },
        function errorCallback(response){}
      );
  };

  function updateScopeAttributes(response){
      $scope.name = response.data.message.organisation;
      $scope.avatar = response.data.message.avatar;
      $scope.occupation = response.data.message.accountOf.occupation;
      $scope.organisation = response.data.message.organisation;
      $scope.companyAccountId = response.data.message._id;
      $scope.location = response.data.message.location;
      $scope.badges = response.data.message.badges;
      $scope.notes = response.data.message.notes;
      $scope.bid = response.data.message.businessId;
      $scope.canSendNeighbourRequest = response.data.message.canSendNeighbourRequest;
      $scope.canCancelNeighbourRequest = response.data.message.canCancelNeighbourRequest;
      $scope.canAnswerNeighbourRequest = response.data.message.canAnswerNeighbourRequest;
      $scope.isNeighbour = response.data.message.isNeighbour;
      $scope.friends = response.data.message.knows;
      $scope.users = response.data.message.accountOf;
  }

// Edit Profile Functions ===============

 $scope.locEdit = function(){
   $('a#loc2').hide();
   $('p#loc1').hide();
   $('a#loc4').show();
   $('a#loc5').show();
   $scope.locationNew = $scope.location;
   $('input#loc3').show();
 };

 $scope.locCancel = function(){
   $scope.locationNew = "";
   $('a#loc2').show();
   $('p#loc1').show();
   $('a#loc4').hide();
   $('a#loc5').hide();
   $('input#loc3').hide();
 };

 $scope.locSave = function(){
   var data = {location: $scope.locationNew };
   $scope.updateCompany(data);
   $('a#loc2').show();
   $('p#loc1').show();
   $('a#loc4').hide();
   $('a#loc5').hide();
   $('input#loc3').hide();
   $scope.locationNew = "";
 };

 $scope.notEdit = function(){
   $('a#not2').hide();
   $('p#not1').hide();
   $('a#not4').show();
   $('a#not5').show();
   $scope.notesNew = $scope.notes;
   $('textarea#not3').show();
 };

 $scope.notCancel = function(){
   $scope.notesNew = "";
   $('a#not2').show();
   $('p#not1').show();
   $('a#not4').hide();
   $('a#not5').hide();
   $('textarea#not3').hide();
 };

 $scope.notSave = function(){
   var data = {notes: $scope.notesNew };
   $scope.updateCompany(data);
   $('a#not2').show();
   $('p#not1').show();
   $('a#not4').hide();
   $('a#not5').hide();
   $('textarea#not3').hide();
   $scope.notesNew = "";
 };

$scope.updateCompany = function(data){
  userAccountAPIService.updateUserAccounts($window.sessionStorage.companyAccountId,data)
    .then(
      function successCallback(response){},
      function errorCallback(response){}
    );
};

});
