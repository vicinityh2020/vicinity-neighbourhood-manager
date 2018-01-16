'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('userProfileController',
function ($scope, $window, $stateParams, $location, commonHelpers, userAccountAPIService, userAPIService, Notification) {

  // ====== Triggers window resize to avoid bug =======
  commonHelpers.triggerResize();

  $scope.locationPrefix = $location.path();

// Define and initialize variables

  // Status flags
  $scope.loaded = false;
  $scope.isMyProfile = true;
  $scope.sameCompany = false;
  $scope.showInput = false;

  // Variables
  $scope.name = "";
  $scope.avatar = "";
  $scope.occupation = "";
  $scope.organisation = "";
  $scope.password = "";
  $scope.email= "";
  $scope.accessLevel = 0;
  $scope.accessLevelCaption = "";
  $scope.roles = [];

  // JQuery variables
  $('a#nameButt').show();
  $('a#edits1').hide();
  $('a#edits2').hide();
  $('input#editNameInput').hide();
  $('p#nameP').show();
  $('p#namePnew').hide();
  $('span#newNameUnderAvatar').hide();
  $('a#nameButt1').show();
  $('a#edits11').hide();
  $('a#edits21').hide();
  $('input#editOccupationInput').hide();
  $('p#nameP1').show();
  $('p#nameP1new').hide();
  $('p#newOccupationUnderAvatar').hide();
  $('a#nameButt2').show();
  $('input#editPassOldInput').hide();
  $('input#editPassNew1Input').hide();
  $('input#editPassNew2Input').hide();
  $('a#edits13').hide();
  $('a#edits23').hide();
  $('a#accessEdit').show();
  $('p#accessName').show();
  $('select#editAccessName').hide();
  $('a#accessSave').hide();
  $('a#accessCancel').hide();

// Loading resources

$scope.isMyProfile = ($window.sessionStorage.userAccountId.toString() === $stateParams.userAccountId.toString());
$scope.sameCompany = ($stateParams.companyAccountId.toString() === $window.sessionStorage.companyAccountId.toString());

userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
  .then(
    function successCallback(resource){
      updateScopeAttributes(resource);
    },
    errorCallback
  );

// Updating resources

function updateScopeAttributes(response){

  var i=0;
  var j=0;
  while (i === 0){
    if (response.data.message.accountOf[j].id._id.toString() === $stateParams.userAccountId.toString()){
      $scope.name =response.data.message.accountOf[j].id.name;
      $scope.occupation=response.data.message.accountOf[j].id.occupation;
      $scope.avatar =response.data.message.accountOf[j].id.avatar;
      $scope.userAccountId = $stateParams.userAccountId;
      $scope.password = response.data.message.accountOf[j].id.authentication.password;
      $scope.email = response.data.message.accountOf[j].id.email;
      $scope.roles = response.data.message.accountOf[j].id.authentication.principalRoles;
      $scope.accessLevel = Number(response.data.message.accountOf[j].id.accessLevel);
      $scope.accessLevelCaption = getCaption($scope.accessLevel);
      i=1;
    }
    j++;
  }

  $scope.pass="";
  for ( var k = 0; k < $scope.password.length; k++ ) {
    $scope.pass += "*";
  }
  $scope.organisation = response.data.message.organisation;
  $scope.orgId = response.data.message._id;
  $scope.loaded = true;
}

// Jquery functions -- Hide/show html

  $scope.changeToInput = function () {
    $('a#nameButt').hide();
    $('p#myName').hide();
    $('input#editNameInput').show();
    $('a#edits1').fadeIn('slow');
    $('a#edits2').fadeIn('slow');
  };

  $scope.backToEdit = function () {
    $('a#edits1').fadeOut('slow');
    $('a#edits2').fadeOut('slow');
    $('input#editNameInput').fadeOut('slow');
    setTimeout(function() {
      $('a#nameButt').fadeIn('fast');
      $('p#myName').fadeIn('fast');
    }, 600);
  };

  $scope.saveNewName = function () {
    userAPIService.editInfoAboutUser($stateParams.userAccountId, {name: $scope.name}).
    then(
      function successCallback(){
      userAPIService.getUser($stateParams.userAccountId)
        .then(
          function successCallback(response) {
            $scope.name = response.data.message.name;
             $('span#nameUnderAvatar').hide();
             $('span#newNameUnderAvatar').show();
           },
           errorCallback
         );
       $('a#edits1').fadeOut('slow');
       $('a#edits2').fadeOut('slow');
       $('input#editNameInput').fadeOut('slow');
       setTimeout(function() {
         $('a#nameButt').fadeIn('fast');
         $('p#myName').fadeIn('fast');
       }, 600);
     },
    errorCallback
  );
};

$scope.changeToInput1 = function () {
  $('a#nameButt1').hide();
  $('p#nameP1').hide();
  $('input#editOccupationInput').show();
  $('a#edits11').fadeIn('slow');
  $('a#edits21').fadeIn('slow');
};

$scope.backToEdit1 = function () {
  $('a#edits11').fadeOut('slow');
  $('a#edits21').fadeOut('slow');
  $('input#editOccupationInput').fadeOut('slow');
  setTimeout(function() {
    $('a#nameButt1').fadeIn('fast');
    $('p#nameP1').fadeIn('fast');
  }, 600);
};

  $scope.saveNewOccupation = function () {
    userAPIService.editInfoAboutUser($stateParams.userAccountId, {occupation: $scope.occupation})
      .then(
        function successCallback(){
          userAPIService.getUser($stateParams.userAccountId).then(
            function successCallback(response) {
              $scope.occupation = response.data.message.occupation;
               $('p#occupationUnderAvatar').hide();
               $('p#newOccupationUnderAvatar').show();
             },
             errorCallback
          );
         $('a#edits11').fadeOut('slow');
         $('a#edits21').fadeOut('slow');
         $('input#editOccupationInput').fadeOut('slow');
         setTimeout(function() {
           $('a#nameButt1').fadeIn('fast');
            $('p#nameP1').fadeIn('fast');
        }, 600);
      },
    errorCallback
    );
  };

  $scope.changeToInput3 = function () {
    $('p#passP').hide();
    $('a#passButt').hide();
    $('input#editPassOldInput').show();
    $('input#editPassNew1Input').show();
    $('input#editPassNew2Input').show();
    $('a#edits13').fadeIn('slow');
    $('a#edits23').fadeIn('slow');
  };

  $scope.backToEdit3 = function () {
    $('a#edits13').fadeOut('slow');
    $('a#edits23').fadeOut('slow');
    $('input#editPassOldInput').fadeOut('slow');
    $('input#editPassNew1Input').fadeOut('slow');
    $('input#editPassNew2Input').fadeOut('slow');

    userAPIService.getUser($stateParams.userAccountId)
      .then(
        function successCallback(response) {
     $scope.password = response.data.message.authentication.password;

         $scope.pass="";
         for (var k = 0; k < $scope.password.length; k++) {
           $scope.pass += "*";
         }
     },
     errorCallback
   );
    setTimeout(function() {
      $('a#passButt').fadeIn('fast');
      $('p#passP').fadeIn('fast');
   }, 600);
 };

  $scope.saveNewPassport = function () {
    // savedAlready2 = true;

    userAPIService.getUser($stateParams.userAccountId)
      .then(
        function successCallback(response) {
         $scope.password = response.data.message.authentication.password;
         if (($scope.pass1 === $scope.pass2) && ($scope.password === $scope.oldPass)){

           userAPIService.editInfoAboutUser($stateParams.userAccountId, {"authentication.password": $scope.pass1})
           .then(
             function successCallback(response) {
             userAPIService.getUser($stateParams.userAccountId)
             .then(
               function successCallback(response) {
               $scope.password = response.data.message.authentication.password;

               $scope.pass="";
               for (var k = 0; k < $scope.password.length; k++) {
                 $scope.pass += "*";
               }

               $('a#edits13').fadeOut('slow');
               $('a#edits23').fadeOut('slow');
               $('input#editPassOldInput').fadeOut('slow');
               $('input#editPassNew1Input').fadeOut('slow');
               $('input#editPassNew2Input').fadeOut('slow');

               $("input#editPassOldInput").val("");
               $('input#editPassNew1Input').val("");
               $('input#editPassNew2Input').val("");

               setTimeout(function() {
                 $('a#passButt').fadeIn('fast');
                 $('p#passP').fadeIn('fast');
              }, 600);
            },
          errorCallback
          );
        },
        errorCallback
      );

     }else{
       var $user = $("#editPassOldInput");
       var $pass = $("#editPassNew1Input");
       var $pass1 = $("#editPassNew2Input");

       $user.addClass("invalid");
       $pass.addClass("invalid");
       $pass1.addClass("invalid");

       setTimeout(function() {
        $user.removeClass("invalid");
        $pass.removeClass("invalid");
        $pass1.removeClass("invalid");
      }, 2000);
     }
   },
   errorCallback
 );
};

/*ACCESS LEVEL*/
$scope.changeToInputAL = function () {
  $('a#accessEdit').hide();
  $('p#accessName').hide();
  $('select#editAccessName').show();
  $('a#accessSave').fadeIn('slow');
  $('a#accessCancel').fadeIn('slow');
};

$scope.backToEditAL = function () {
  $('a#accessCancel').fadeOut('slow');
  $('a#accessSave').fadeOut('slow');
  $('select#editAccessName').fadeOut('slow');
  setTimeout(function() {
    $('a#accessEdit').fadeIn('fast');
    $('p#accessName').fadeIn('fast');
  }, 600);
};

$scope.saveNewAccess = function () {
  var lvl = Number($('select#editAccessName').val()) - 1;
  if (Number($('select#editAccessName').val()) >= 0){
      userAPIService.editInfoAboutUser($stateParams.userAccountId,
        {accessLevel: lvl})
        .then(
          function successCallback(response){
            $scope.accessLevel = Number(response.data.message.accessLevel);
            $scope.accessLevelCaption = getCaption($scope.accessLevel);
            $scope.backToEditAL();
          }
        );
      }
    };

function getCaption(lvl){
  var ret;
  switch(lvl) {
    case 0:
        ret = "Only my organisation";
        break;
    case 1:
        ret = "Only my friends";
        break;
    case 2:
        ret = "Everyone can see";
        break;
    default:
        ret = "Wrong access level";
        break;
      }
      return ret;
    }

// Handle errors

function errorCallback(err){
  Notification.error('Something went wrong: ' + err);
}

// Picture upload/change

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
    $("img#pic").prop("src",$scope.avatar);
    $('img#pic').fadeIn('slow');
 }, 600);
};

$scope.uploadPic = function(){
userAPIService.editInfoAboutUser($stateParams.userAccountId, {avatar: base64String})
  .then(
    function successCallback(){
      userAPIService.getUser($stateParams.userAccountId)
        .then(
          function successCallback(response) {
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
         errorCallback
      );
    },
    errorCallback
  );
};

});
