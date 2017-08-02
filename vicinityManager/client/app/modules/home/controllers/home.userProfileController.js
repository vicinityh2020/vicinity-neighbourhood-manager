angular.module('VicinityManagerApp.controllers')
.controller('userProfileController',
function ($scope, $window, $stateParams, $location, userAccountAPIService, userAPIService, AuthenticationService, Notification  , FileUploader) {
  $(window).trigger('resize');

  $scope.loaded = false;

  $scope.uploader = new FileUploader();
  $scope.uploadme = {};
  $scope.uploadme.src = "";

  $scope.locationPrefix = $location.path();
  console.log("location:" + $location.path());

  $scope.name = {};
  $scope.avatar = {};
  $scope.nameAvatar = {};
  $scope.newName = {};
  // $scope.nameAvatar = {};
  $scope.occupation = {};
  $scope.newOccupation = {};
  $scope.occupationAvatar = {};
  $scope.organisation = {};
  // $scope.userAccountId = {};
  $scope.newLocation = {};
  $scope.locationAvatar = {};

  $scope.password = {};
  $scope.email= {};
  $scope.isMyProfile = true;
  $scope.canSendNeighbourRequest = false;
  $scope.canCancelNeighbourRequest = false;
  $scope.canAnswerNeighbourRequest = false;
  $scope.isNeighbour = false;

  $scope.sameCompany = false;

  $scope.location = {};
  $scope.badges = {};

  $scope.roles = [];

  $scope.notes = {};
  $scope.friends = [];
  $scope.following = [];
  $scope.followers = [];
  $scope.gateways = [];

  $scope.showInput = false;

  $scope.userAccounts = [];
  $scope.companyAccounts = [];
  $scope.thisCompany = {};
  $scope.friendsThisCom = [];





  var savedAlready = false;
  var savedAlready1 = false;
  var savedAlready2 = false;
  var base64String= "";

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
  $('a#edits12').hide();
  $('a#edits22').hide();
  $('input#editLocationInput').hide();
  $('p#namePloc').show();
  $('p#namePlocnew').hide();
  // $('p#newOccupationUnderAvatar').hide();
  $('input#editPassOldInput').hide();
  $('input#editPassNew1Input').hide();
  $('input#editPassNew2Input').hide();

  $('a#edits13').hide();
  $('a#edits23').hide();

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


//   function readURL(input)
// {
//     // document.getElementById("pic").style.display = "block";
//     $("img#pic").prop("display","block");
//
//     if (input.files && input.files[0]) {
//         var reader = new FileReader();
//
//         reader.onload = function (e) {
//             // document.getElementById('pic').src =  e.target.result;
//             $("img#pic").prop("src",e.target.result);
//         }
//
//         reader.readAsDataURL(input.files[0]);
//     }
// }

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(response) {
        $scope.userAccounts = response.data.message.accountOf;
        $scope.thisCompany = response.data.message;
      },
      function errorCallback(response){
      }
    );

  userAccountAPIService.getUserAccounts()
    .then(
      function successCallback(resource) {
        $scope.companyAccounts = resource.data.message;
      },
      function errorCallback(resource){
      }
    );

  userAccountAPIService.getFriends($stateParams.companyAccountId)
    .then(
      function successCallback(resource) {
        $scope.friendsThisCom = resource.data.message;
      },
      function errorCallback(resource){
      }
    );

  $scope.changeToInput = function () {
    $('a#nameButt').hide();
    $('p#nameP').hide();
    $('p#namePnew').hide();
    $('input#editNameInput').show();
    $('a#edits1').fadeIn('slow');
    $('a#edits2').fadeIn('slow');

  }

  $scope.backToEdit = function () {
    $('a#edits1').fadeOut('slow');
    $('a#edits2').fadeOut('slow');
    $('input#editNameInput').fadeOut('slow');
    if (savedAlready){
      $("input#editNameInput").val($scope.newName);
    }else{
      $("input#editNameInput").val($scope.nameAvatar);
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

  $scope.saveNewName = function () {
    savedAlready = true;
    userAPIService.editInfoAboutUser($stateParams.userAccountId, {name: $scope.name}).
    then(
      function successCallback(){
      userAPIService.getUser($stateParams.userAccountId)
        .then(
          function successCallback(response) {
    //  $scope.newName = response.message.name;
     $scope.newName = response.data.message.name;
     $('span#nameUnderAvatar').hide();
     $('span#newNameUnderAvatar').show();
      },
      function errorCallback(response){}
    );

     $('a#edits1').fadeOut('slow');
     $('a#edits2').fadeOut('slow');
     $('input#editNameInput').fadeOut('slow');

     setTimeout(function() {
       $('a#nameButt').fadeIn('fast');
       $('p#namePnew').fadeIn('fast');
    }, 600);

    },
    function errorCallback(){}
  );
  }

  $scope.saveNewOccupation = function () {
    savedAlready = true;
    userAPIService.editInfoAboutUser($stateParams.userAccountId, {occupation: $scope.occupation})
      .then(
        function successCallback(){
      userAPIService.getUser($stateParams.userAccountId).then(
        function successCallback(response) {
     $scope.newOccupation = response.data.message.occupation;
     $('p#occupationUnderAvatar').hide();
     $('p#newOccupationUnderAvatar').show();
     },
     function errorCallback(response){}
    );

     $('a#edits11').fadeOut('slow');
     $('a#edits21').fadeOut('slow');
     $('input#editOccupationInput').fadeOut('slow');

     setTimeout(function() {
       $('a#nameButt1').fadeIn('fast');
       $('p#nameP1new').fadeIn('fast');
    }, 600);

      },
    function errorCallback(){}
    );
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

  $scope.saveNewLocation = function () {
    savedAlready2 = true;
    userAPIService.editInfoAboutUser($stateParams.userAccountId, {location: $scope.location})
      .then(
        function successCallback(){
      userAPIService.getUser($stateParams.userAccountId)
        .then(
          function successCallback(response) {
     $scope.newLocation = response.data.message.location;
    //  $('p#occupationUnderAvatar').hide();
    //  $('p#newOccupationUnderAvatar').show();
    },
    function errorCallback(){}
  );

     $('a#edits12').fadeOut('slow');
     $('a#edits22').fadeOut('slow');
     $('input#editLocationInput').fadeOut('slow');

     setTimeout(function() {
       $('a#nameButt2').fadeIn('fast');
       $('p#namePlocnew').fadeIn('fast');
    }, 600);

    },
    function errorCallback(){}
  );
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

  $scope.changeToInput3 = function () {
    $('p#passP').hide();
    $('a#passButt').hide();
    $('input#editPassOldInput').show();
    $('input#editPassNew1Input').show();
    $('input#editPassNew2Input').show();
    $('a#edits13').fadeIn('slow');
    $('a#edits23').fadeIn('slow');
  }

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

         $scope.text1="";
         k=0;

             for (k = 0; k < $scope.password.length; k++) {
             $scope.text1 += "*";
         };

        //  $('p#passP').fadeIn('fast');
     },
     function errorCallback(){}
   );


    // if (savedAlready2){
    //   $("input#editLocationInput").val($scope.newLocation);
    // }else{
    //   $("input#editLocationInput").val($scope.locationAvatar);
    // };

    setTimeout(function() {
      $('a#passButt').fadeIn('fast');
      $('p#passP').fadeIn('fast');
      // if (savedAlready2){
      //   $('p#namePlocnew').fadeIn('fast');
      // }else{
      //   $('p#namePloc').fadeIn('fast');
      // };
   }, 600);

  }

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

           $scope.text1="";
           k=0;

               for (k = 0; k < $scope.password.length; k++) {
               $scope.text1 += "*";
           };
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
        function errorCallback(){}
      );
      },
      function errorCallback(){}
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

     };
   },
   function errorCallback(){}
 );
  }



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

  // $scope.uploadPic = function(){
  //   $("img#pic").prop("src",$scope.uploadme.src);
  // };

  // $scope.readURL = function(input){
  //           if (input.files && input.files[0]) {
  //               var reader = new FileReader();
  //
  //               reader.onload = function (e) {
  //                   $('#pic')
  //                       .attr('src', e.target.result);
  //               };
  //
  //               reader.readAsDataURL(input.files[0]);
  //           }
  //       }

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
           function errorCallback(response){}
        );
    },
    function errorCallback(){}
  );
}
  // var f = document.getElementById('input1').files[0];
  // var r = new FileReader();
  // r.onloadend = function(e){
  //   var data = e.target.result;
  //   $("img#pic").prop("src",data);
  // };
  // r.readAsArrayBuffer(f);

// function getBase64Image(img) {
//     var canvas = document.createElement("canvas");
//     canvas.width = img.width;
//     canvas.height = img.height;
//
//     var ctx = canvas.getContext("2d");
//     ctx.drawImage(img, 0, 0);
//
//     var dataURL = canvas.toDataURL("image/png");
//
//     return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
// }

  // function updateScopeAttributes2(response){
  //       userAPIService.getUser($stateParams.userAccountId).success(function (response) {
  //         $scope.nameAvatar =response.name;
  //       });
  //
  //   //     $scope.name =response.name;
  //   //     $scope.occupation=response.occupation;
  //   //     $scope.avatar =response.avatar;
  //   //     $scope.userAccountId = $stateParams.userAccountId;
  //   //     $scope.location = response.location;
  //   //     $scope.password = response.authentication.password;
  //   //     $scope.email = response.email;
  //   //
  //   // $scope.text1="";
  //   // k=0;
  //   //
  //   //     for (k = 0; k < $scope.password.length; k++) {
  //   //     $scope.text1 += "*";
  //   // };
  //
  // }

    // $scope.sendNeighbourRequest = function () {
    //     var result = userAccountAPIService
    //         .sendNeighbourRequest($scope.userAccountId)
    //             .success(function(response) {
    //                 if (response.error == true) {
    //                     Notification.error("Sending neighbour request failed!");
    //                 } else {
    //                     Notification.success("Neighbour request sent!");
    //                 }
    //
    //                 userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
    //             });
    // }
    //
    // $scope.acceptNeighbourRequest = function () {
    //     userAccountAPIService.acceptNeighbourRequest($scope.userAccountId)
    //         .success(function(response){
    //             if (response.error == true) {
    //                 Notification.error("Neighbour request acceptation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request accepted!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.rejectNeighbourRequest = function() {
    //     userAccountAPIService.rejectNeighbourRequest($scope.userAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request rejection failed :(");
    //             } else {
    //                 Notification.success("Neighbour request rejected!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourRequest = function() {
    //     userAccountAPIService.cancelNeighbourRequest($scope.userAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbour request cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbour request canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
    //         });
    // }
    //
    // $scope.cancelNeighbourship = function() {
    //     userAccountAPIService.cancelNeighbourship($scope.userAccountId)
    //         .success(function(response){
    //             if (response.error ==true) {
    //                 Notification.error("Neighbourship cancelation failed :(");
    //             } else {
    //                 Notification.success("Neighbourship canceled!");
    //             }
    //
    //             userAccountAPIService.getUserAccountProfile($scope.userAccountId).success(updateScopeAttributes);
    //         });
    // }

  if ($window.sessionStorage.userAccountId.toString() === $stateParams.userAccountId.toString()){
    $scope.isMyProfile = true;
  } else {
    $scope.isMyProfile = false;
  }

  if ($stateParams.companyAccountId.toString() === $window.sessionStorage.companyAccountId.toString()){
    $scope.sameCompany = true;
  } else {
    $scope.sameCompany = false;
  }

  // userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId).success(updateScopeAttributes);

  userAccountAPIService.getUserAccountProfile($stateParams.companyAccountId)
    .then(
      function successCallback(resource){
        updateScopeAttributes(resource);
      },
      function errorCallback(resource){
      }
    );

  function updateScopeAttributes(response){

    i=0;
    j=0;
    while (i==0){
      if (response.data.message.accountOf[j]._id.toString() === $stateParams.userAccountId.toString()){
        $scope.nameAvatar =response.data.message.accountOf[j].name;
        $scope.name =response.data.message.accountOf[j].name;
        $scope.occupation=response.data.message.accountOf[j].occupation;
        $scope.occupationAvatar=response.data.message.accountOf[j].occupation;
        $scope.avatar =response.data.message.accountOf[j].avatar;
        $scope.userAccountId = $stateParams.userAccountId;
        $scope.locationAvatar = response.data.message.accountOf[j].location;
        $scope.location = response.data.message.accountOf[j].location;
        $scope.password = response.data.message.accountOf[j].authentication.password;
        $scope.email = response.data.message.accountOf[j].email;
        $scope.roles = response.data.message.accountOf[j].authentication.principalRoles;

        i=1;
      };
      j++;
    };

    $scope.text1="";
    k=0;

        for (k = 0; k < $scope.password.length; k++) {
        $scope.text1 += "*";
    };

      // $scope.name = response.message.accountOf.name;
      // $scope.avatar = response.message.avatar;
      // $scope.occupation = response.message.accountOf.occupation;
      $scope.organisation = response.data.message.organisation;
      // $scope.userAccountId = response.message._id;
      $scope.badges = response.data.message.badges;
      $scope.notes = response.data.message.notes;
      $scope.canSendNeighbourRequest = response.data.message.canSendNeighbourRequest;
      $scope.canCancelNeighbourRequest = response.data.message.canCancelNeighbourRequest;
      $scope.canAnswerNeighbourRequest = response.data.message.canAnswerNeighbourRequest;
      $scope.isNeighbour = response.data.message.isNeighbour;
      $scope.friends = response.data.message.knows;

      $scope.loaded = true;
  }



});
