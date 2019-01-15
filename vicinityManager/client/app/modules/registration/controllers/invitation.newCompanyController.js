'use strict';

angular.module('Registration')

  .controller('invitationNewCompanyController',
             ['$scope', 'configuration', '$stateParams', 'invitationsAPIService', 'registrationsAPIService', 'Notification', '$q',
             function ($scope, configuration, $stateParams, invitationsAPIService, registrationsAPIService, Notification, $q){

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
       $scope.baseHref = configuration.baseHref + '/#/login';
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
    var $pass1 = $("#pw1");
    var $pass2 = $("#pw2");
    if ($scope.password1Reg === $scope.password2Reg){
      if($scope.password1Reg.length > 7){

      findMeDuplicates()
      .then(function(response){
      return registrationsAPIService.postOne(
          { userName: $scope.nameReg,
            email: $scope.emailReg,
            password: $scope.password1Reg,
            occupation: $scope.occupationReg,
            companyName: $scope.companynameReg,
            companyLocation: $scope.locationReg,
            businessId: $scope.bidReg,
            termsAndConditions: true,
            status: "pending",
            type: "newCompany"
          });
        })
        .then(endRegistration)
        .catch(function(err){
          if(err !== "DUPLICATES"){
            console.log(err);
            Notification.error("There was an issue in the registration process: " + err);
          } else {
            if($scope.emailReg === "" && $scope.companynameReg === ""){
              Notification.warning('The mail and company name are duplicated!!!');
            } else if($scope.emailReg === "" && $scope.companynameReg !== "") {
              Notification.warning('The mail is duplicated!!!');
            } else {
              Notification.warning('The company name is duplicated!!!');
            }
          }
        });
      }else{
        Notification.warning("The password must have at least 8 characters...");
         $pass1.addClass("invalid");
         $pass2.addClass("invalid");
          setTimeout(function() {
           $pass1.removeClass("invalid");
           $pass2.removeClass("invalid");
          }, 2000);
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
  };


   /*
   Check for duplicate mail or company name
   Also in the registration document
   TODO Check company BID
   */
     var findMeDuplicates = function(){
       var aux = false;
       return $q(function(resolve, reject) {
         registrationsAPIService.findDuplicatesUser({email: $scope.emailReg})
         .then( function(response){
           aux = response.data.message;
           if(response.data.message) $scope.emailReg = "";
           return registrationsAPIService.findDuplicatesCompany({companyName: $scope.companynameReg, businessID: $scope.bidReg});
         })
         .then( function(response){
           if(!aux) aux = response.data.message; // If aux is already true must remain true, there are already duplicates
           if(response.data.message) $scope.companynameReg = "";
           return registrationsAPIService.findDuplicatesRegMail({email: $scope.emailReg});
         })
         .then( function(response){
           if(!aux) aux = response.data.message; // If aux is already true must remain true, there are already duplicates
           if(response.data.message) $scope.emailReg = "";
           if(aux){ reject("DUPLICATES"); } else { resolve(aux); }
         })
         .catch( function(err){
           reject(err);
         });
       });
     };

     // Handler of successful registration
     var endRegistration = function(response){
       $('div#newOrganisationInfo').fadeOut('slow');
       setTimeout(function() {
        $('div#verEmailSent').fadeIn();
        }, 1000);
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
