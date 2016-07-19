angular.module('VicinityManagerApp.controllers')
.controller('deviceProfileController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, itemsAPIService, AuthenticationService, Notification) {

  $scope.locationPrefix = $location.path();
  console.log("location:" + $location.path());
  $scope.name = {};

  $scope.avatar = {};
  $scope.nameAvatar = "";
  $scope.newName = "";
  $scope.newLocation = {};
  $scope.locationAvatar = {};
  $scope.occupation = {};
  $scope.newOccupation = {};

  $scope.avatar = {};
  $scope.occupation = {};
  $scope.organisation = {};
  $scope.companyAccountId = {};
  $scope.isMyProfile = true;
  $scope.canSendNeighbourRequest = false;
  $scope.canCancelNeighbourRequest = false;
  $scope.canAnswerNeighbourRequest = false;
  $scope.isNeighbour = false;
  $scope.location = {};
  $scope.badges = {};
  $scope.notes = {};
  $scope.friends = [];
  $scope.following = [];
  $scope.followers = [];
  $scope.gateways = [];
  $scope.users = [];
  $scope.devices = [];
  $scope.loaded = false;
  $scope.isMyDevice = false;
  $scope.serNumber = "";
  $scope.location = "";
  $scope.AL = 0;
  $scope.showInput = false;
  $scope.showImg = false;

  var savedAlready = false;
  var savedAlready1 = false;
  var savedAlready2 = false;
  var base64String= "";

  $('a#nameButt').show();
  $('a#edits1').hide();
  $('a#edits2').hide();
  // $('input#editNameInput').hide();
  $('select#editNameInput').hide();
  $('p#nameP').show();
  $('p#namePnew').hide();

  $('a#nameButt2').show();
  $('a#edits12').hide();
  $('a#edits22').hide();
  $('input#editLocationInput').hide();
  $('p#namePloc').show();
  $('p#namePlocnew').hide();

  $('a#nameButt1').show();
  $('a#edits11').hide();
  $('a#edits21').hide();
  $('input#editOccupationInput').hide();
  $('p#nameP1').show();
  $('p#nameP1new').hide();
  $('p#newOccupationUnderAvatar').hide();

  $("input#input1").on('change',function(evt) {

    var tgt = evt.target || window.event.srcElement,
          files = tgt.files;

    if (FileReader && files && files.length) {
          var fr = new FileReader();
          fr.onload = function () {
              // $("img#pic").src = fr.result;
              $("img#pic").prop("src",fr.result);
              base64String = fr.result;
          }
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
    itemsAPIService.putOne($stateParams.deviceId, {avatar: base64String}).success(function (){
      itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function (response) {
        $scope.avatar = response.message.avatar;
        $('#editCancel1').fadeOut('slow');
        $('#editUpload2').fadeOut('slow');
        $('#input1').fadeOut('slow');
        $('img#pic').fadeOut('slow');
        setTimeout(function() {
          $("img#pic").prop("src",$scope.avatar);
          $('img#pic').fadeIn('slow');
       }, 600);
      });
    });
  };

  $scope.changeToInput = function () {
    $('a#nameButt').hide();
    $('p#nameP').hide();
    $('p#namePnew').hide();
    // $('input#editNameInput').show();
    $('select#editNameInput').show();
    $('a#edits1').fadeIn('slow');
    $('a#edits2').fadeIn('slow');

  }

  $scope.saveNewName = function () {
    savedAlready = true;
    if ($('select#editNameInput').val() != 0){
        itemsAPIService.putOne($stateParams.deviceId, {accessLevel: $('select#editNameInput').val() }).success(function (){         //!!!!!!!!!! zmenit accessLevel na nove cislo, dorobit!!!
          itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function (response) {
              //  $scope.newName = response.message.name;
              //  $scope.newName = response.message.name;
              $scope.AL = response.message.accessLevel;
              if ($scope.AL == 1){
                $scope.newName = "Private";
              }else if ($scope.AL == 2){
                $scope.newName = "Metadata access";
              }else if ($scope.AL == 3){
                $scope.newName = "Shared with partners";
              }else {
                $scope.newName = "Public";
              };
               $('span#nameUnderAvatar').hide();
               $('span#newNameUnderAvatar').show();
         });

         $('a#edits1').fadeOut('slow');
         $('a#edits2').fadeOut('slow');
        //  $('input#editNameInput').fadeOut('slow');
         $('select#editNameInput').fadeOut('slow');

         setTimeout(function() {
           $('a#nameButt').fadeIn('fast');
           $('p#namePnew').fadeIn('fast');
        }, 600);

        });
    }
  }

  $scope.backToEdit = function () {
    $('a#edits1').fadeOut('slow');
    $('a#edits2').fadeOut('slow');
    // $('input#editNameInput').fadeOut('slow');
    $('select#editNameInput').fadeOut('slow');
    if (savedAlready){
      // $("input#editNameInput").val($scope.newName);
      // $("select#editNameInput").val($scope.newName);
    }else{
      // $("input#editNameInput").val($scope.nameAvatar);
      // $("select#editNameInput").val($scope.nameAvatar);
    };

    setTimeout(function() {
      $('a#nameButt').fadeIn('fast');
      if (savedAlready){
        $('p#namePnew').fadeIn('fast');
      }else{
        $('p#nameP').fadeIn('fast');
      };
   }, 600);

  }

  $scope.saveNewLocation = function () {
    savedAlready2 = true;
    itemsAPIService.putOne($stateParams.deviceId, {"info.location": $scope.location}).success(function (){
      itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function (response) {
     $scope.newLocation = response.message.info.location;
    //  $('p#occupationUnderAvatar').hide();
    //  $('p#newOccupationUnderAvatar').show();
     });

     $('a#edits12').fadeOut('slow');
     $('a#edits22').fadeOut('slow');
     $('input#editLocationInput').fadeOut('slow');

     setTimeout(function() {
       $('a#nameButt2').fadeIn('fast');
       $('p#namePlocnew').fadeIn('fast');
    }, 600);

    });
  }

  $scope.changeToInput2 = function () {
    $('a#nameButt2').hide();
    $('p#namePloc').hide();
    $('p#namePlocnew').hide();
    $('input#editLocationInput').show();
    $('a#edits12').fadeIn('slow');
    $('a#edits22').fadeIn('slow');

  }

  $scope.backToEdit2 = function () {
    $('a#edits12').fadeOut('slow');
    $('a#edits22').fadeOut('slow');
    $('input#editLocationInput').fadeOut('slow');

    if (savedAlready2){
      $("input#editLocationInput").val($scope.newLocation);
    }else{
      $("input#editLocationInput").val($scope.locationAvatar);
    };

    setTimeout(function() {
      $('a#nameButt2').fadeIn('fast');
      if (savedAlready2){
        $('p#namePlocnew').fadeIn('fast');
      }else{
        $('p#namePloc').fadeIn('fast');
      };
   }, 600);

  }

  $scope.saveNewOccupation = function () {
    savedAlready = true;
    itemsAPIService.putOne($stateParams.deviceId, {"info.serial_number": $scope.occupation}).success(function (){
      itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function (response) {
     $scope.newOccupation = response.message.info.serial_number;
     $('p#occupationUnderAvatar').hide();
     $('p#newOccupationUnderAvatar').show();
     });

     $('a#edits11').fadeOut('slow');
     $('a#edits21').fadeOut('slow');
     $('input#editOccupationInput').fadeOut('slow');

     setTimeout(function() {
       $('a#nameButt1').fadeIn('fast');
       $('p#nameP1new').fadeIn('fast');
    }, 600);

    });
  }

  $scope.changeToInput1 = function () {
    $('a#nameButt1').hide();
    $('p#nameP1').hide();
    $('p#nameP1new').hide();
    $('input#editOccupationInput').show();
    $('a#edits11').fadeIn('slow');
    $('a#edits21').fadeIn('slow');

  }

  $scope.backToEdit1 = function () {
    $('a#edits11').fadeOut('slow');
    $('a#edits21').fadeOut('slow');
    $('input#editOccupationInput').fadeOut('slow');

    if (savedAlready1){
      $("input#editOccupationInput").val($scope.newOccupation);
    }else{
      $("input#editOccupationInput").val($scope.occupationAvatar);
    };

    setTimeout(function() {
      $('a#nameButt1').fadeIn('fast');
      if (savedAlready1){
        $('p#nameP1new').fadeIn('fast');
      }else{
        $('p#nameP1').fadeIn('fast');
      };
   }, 600);

  }

    // $scope.sendNeighbourRequest = function () {
    //     var result = userAccountAPIService
    //         .sendNeighbourRequest($stateParams.companyAccountId)
    //             .success(function(response) {
    //                 if (response.error == true) {
    //                     Notification.error("Sending neighbour request failed!");
    //                 } else {
    //                     Notification.success("Neighbour request sent!");
    //                 }
    //
    //                 userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //             });
    // }
    //
    // $scope.acceptNeighbourRequest = function () {
    //     userAccountAPIService.acceptNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error == true) {
    //                 Notification.error("Neighbour request acceptation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request accepted!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //             // itemsAPIService.addFriendToHasAccess($stateParams.companyAccountId);
    //
    //         });
    // }
    //
    // $scope.rejectNeighbourRequest = function() {
    //     userAccountAPIService.rejectNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request rejection failed :(");
    //             } else {
    //                 Notification.success("Neighbour request rejected!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourRequest = function() {
    //     userAccountAPIService.cancelNeighbourRequest($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourship = function() {
    //     userAccountAPIService.cancelNeighbourship($stateParams.companyAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbourship cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbourship canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);
    //         });
    // }

  // userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(
  //   function(response){
  //     updateScopeAttributes(response);
  //     $scope.loaded = true;
  //   });

  itemsAPIService.getItemWithAdd($stateParams.deviceId).success(function(response){
    updateScopeAttributes(response);
    $scope.loaded = true;
  });

  // userAccountAPIService.getMyDevices($stateParams.companyAccountId).success(function(response){
  //   $scope.devices=response.message;
  // });

  function updateScopeAttributes(response){
      $scope.name = response.message.name;
      $scope.avatar = response.message.avatar;
      $scope.owner = response.message.hasAdministrator[0].organisation;
      $scope.owner_id = response.message.hasAdministrator[0]._id;
      $scope.serNumber = response.message.info.serial_number;
      $scope.location = response.message.info.location;
      $scope.locationAvatar = response.message.info.location;
      $scope.occupationAvatar = response.message.info.serial_number;
      $scope.AL = response.message.accessLevel;
      $("input#editOccupationInput").val($scope.occupationAvatar);
      if ($scope.AL === 1){
        $scope.nameAvatar = "Private";
      }else if ($scope.AL === 2){
        $scope.nameAvatar = "Metadata access";
      }else if ($scope.AL === 3){
        $scope.nameAvatar = "Shared with partners";
      }else {
        $scope.nameAvatar = "Public";
      };

      // $scope.occupation = response.message.accountOf.occupation;
      // $scope.organisation = response.message.organisation;
      // $scope.companyAccountId = response.message._id;
      // $scope.location = response.message.accountOf.location;
      // $scope.badges = response.message.badges;
      // $scope.notes = response.message.notes;
      // $scope.canSendNeighbourRequest = response.message.canSendNeighbourRequest;
      // $scope.canCancelNeighbourRequest = response.message.canCancelNeighbourRequest;
      // $scope.canAnswerNeighbourRequest = response.message.canAnswerNeighbourRequest;
      // $scope.isNeighbour = response.message.isNeighbour;
      // $scope.friends = response.message.knows;
      // $scope.users = response.message.accountOf;
      if ($window.sessionStorage.companyAccountId.toString() === $scope.owner_id.toString()){
        $scope.isMyDevice = true;
      } else {
        $scope.isMyDevice = false;
      }
  };
});
