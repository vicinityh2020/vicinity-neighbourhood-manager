'use strict';

angular.module('Registration')

  .controller('invitationNewCompanyController',
             ['$scope', '$rootScope', '$location', '$state', '$window', '$stateParams', 'invitationsAPIService', 'registrationsAPIService', 'userAccountAPIService', 'AuthenticationService', 'Notification',
             function ($scope, $rootScope, $location, $state, $window, $stateParams, invitationsAPIService, registrationsAPIService, userAccountAPIService, AuthenticationService, Notification){

      // Rest login status
      // AuthenticationService.ClearCredentials();
      $scope.duplicities = [];
       $scope.isError = false;
       $scope.visib = 'visible';
       $scope.visib2 = 'hidden';
       $scope.showPass = "password";
       $scope.newRegisHide = true;
       $scope.newRegis = false;
       $scope.newComp = false;
       $scope.newUser = false;
       $scope.newRegis2 = false;
       $scope.comps = [];
       $scope.note2 = "Registration form";
       $scope.compName = "";
       $scope.termsAccepted = false;
       //$scope.newRegis2 = false;
       //$scope.comps = [];

       $('div#myModal1').hide();
       $('div#newOrganisationInfo').show();
       $('div#newUserInfo').hide();
       $('div#verEmailSent').hide();


       var myInit = function(){
         invitationsAPIService.getOne($stateParams.invitationId)
          .then(
           function successCallback(response){
           var results = response.data.message;
           $scope.alreadyUsed = results.used;
           $scope.companynameReg = results.nameTo;
           $scope.emailReg = results.emailTo;
           $scope.companyIdUs = results.sentBy.companyId;
         },
          function errorCallback(response){}
        );
      };
      myInit();

// Register new company

  $scope.regisComp = function () {
   var $pass1 = $("#pwUs1");
   var $pass2 = $("#pwUs2");
   if ($scope.password1Reg){
     if ($scope.password1Reg === $scope.password2Reg){
       if($scope.duplicities.length === 0){
       registrationsAPIService.postOne({userName: $scope.nameReg, email: $scope.emailReg,
                                       password: $scope.password1Reg, occupation: $scope.occupationReg,
                                       companyName: $scope.companynameReg , companyLocation: $scope.locationReg,
                                       businessId: $scope.bidReg, termsAndConditions: true, status: "pending", type: "newCompany"})
         .then(
           function successCallback(response){
             $('div#newOrganisationInfo').fadeOut('slow');
             setTimeout(function() {
              $('div#verEmailSent').fadeIn();
              }, 1000);
           },
           function errorCallback(){Notification.warning("There was an issue in the registration process...");}
         );
       }else{
         loopArray($scope.duplicities);
         Notification.warning('There are duplicated values!!!');
         $scope.duplicities = [];
       }
       }else{
         Notification.warning("Passwords do not match...");
         $pass1.addClass("invalid");
         $pass2.addClass("invalid");
         setTimeout(function() {
           $pass1.removeClass("invalid");
           $pass2.removeClass("invalid");
         }, 2000);
       }
     }
   };

   $scope.findMeDuplicates = function(){
     registrationsAPIService.findDuplicatesUser({email: $scope.emailReg})
     .then(
       function successCallback(response){
         if(response.data.message){
           $scope.duplicities.push(response.data.message);
         }
         registrationsAPIService.findDuplicatesCompany({companyName: $scope.companynameReg, businessID: $scope.bidReg})
           .then(
             function successCallback(response){
               if(response.data.message){
                 $scope.duplicities.push(response.data.message);
               }
               $scope.regisComp();
             },
             function errorCallback(reponse){}
           );
         },
         function errorCallback(reponse){}
       );
     };

   var loopArray = function(arr) {
     if ( typeof(arr) == "object") {
         for (var i = 0; i < arr.length; i++) {
           // console.log(arr[i]);
           if($scope.companynameReg === arr[i].organisation){ $scope.companynameReg = ""; }
           if($scope.emailReg === arr[i].email){ $scope.emailReg = ""; }
           if($scope.bidReg === arr[i].businessID){ $scope.bidReg = ""; }
           loopArray(arr[i]);
         }
     }
 };

 // Handling modals

         $scope.alertPopUp1 = function () {
           $('div#myModal1').show();
         };

         $scope.closeNow1 = function () {
           $('div#myModal1').hide();
         };

         $scope.acceptTerms = function(){
           $scope.termsAccepted = true;
           $('div#myModal1').hide();
         };

}]);
