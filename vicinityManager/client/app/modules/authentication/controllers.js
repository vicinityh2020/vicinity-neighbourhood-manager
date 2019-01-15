'use strict';

angular.module('Authentication')

  .controller('LoginController',
             ['$scope', '$rootScope', '$location', '$state', '$window', 'userAccountAPIService', 'AuthenticationService', 'registrationsAPIService', 'Notification', '$q',
             function ($scope, $rootScope, $location, $state, $window, userAccountAPIService, AuthenticationService, registrationsAPIService, Notification, $q){


// INITIAL set up ===============================================

   //reset login status
   AuthenticationService.ClearCredentials();
   $scope.duplicities = [];
   $scope.isError = false;
   $scope.showPass = "password";
   $scope.number = 1;
   $scope.note ="Register new company";
   $scope.note2 = "Log in to start your session";
   $scope.error = "";
   $scope.termsAccepted = false;
   $scope.rememberMe = false;

   $('div#allTemplates').show();
   $('div#login-wrap').show();
   $('div#myModal1').hide();
   $("#myCheck").prop("checked", false);
   $("#pass").prop("type", "password");
   $('div#newOrganisationInfo').hide();
   $('div#newUserInfo').hide();
   $('div#verEmailSent').hide();
   $('div#forgot1').hide();
   $('div#forgot2').hide();

// Check screen resolution

$scope.imMobile = Number($window.innerWidth) < 768;
$(window).on('resize',function(){
  $scope.imMobile = Number($window.innerWidth) < 768;
});

// Look for rememberMe cookie

  AuthenticationService.wasCookie();

/*
 LOGIN function
*/

$scope.login = function() {
  $scope.dataLoading = true;
  AuthenticationService.Login($scope.username, $scope.password)
  .then(function(response){
    var $user = $("#user");
    var $pass = $("#pass");

     if(response.status < 400){
      //  Notification.success("Welcome to Vicinity!");
       AuthenticationService.SetCredentials(response.data.message);
       if($scope.rememberMe){AuthenticationService.SetRememberMeCookie(response.data.message);}
       $location.path("/home");
       $scope.isError = false;
     } else {
       $scope.error = "Incorrect email or password";
       $user.addClass("invalid");
       $pass.addClass("invalid");

      //  Notification.error("Incorrect email or password");
       $scope.isError = true;
       $scope.dataLoading = false;
       $scope.password = "";

       setTimeout(function() {
         $user.removeClass("invalid");
         $pass.removeClass("invalid");
         $scope.dataLoading = false;
      }, 2000);
     }
  })
  .catch(function(err){
    var $user = $("#user");
    var $pass = $("#pass");
    if(err.status < 500){
      $scope.error = "Incorrect email or password";
      $user.addClass("invalid");
      $pass.addClass("invalid");
    } else {
      console.log(err);
      $scope.error = "Server error";
    }
   //  Notification.error("Incorrect email or password");
    $scope.isError = true;
    $scope.dataLoading = false;
    $scope.password = "";

    setTimeout(function() {
      $user.removeClass("invalid");
      $pass.removeClass("invalid");
      $scope.dataLoading = false;
   }, 2000);
  });
};

/*
Function for registering new company
*/
$scope.registerCompany = function () {
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
          type: "newCompany"
        });
      })
      .then(endRegistration)
      .catch(function(err){
        if(err !== "DUPLICATES"){
          console.log(err);
          Notification.error("There was an issue in the registration process");
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
  Recover password
*/
$scope.recoverPwd = function(){
  AuthenticationService.recover({username : $scope.emailRecover})
  .then(
    function(response){
    if(response.data.error){
      Notification.warning("The username does not exist...");
      $scope.emailRecover = "";
    }else{
      $('div#allTemplates').fadeOut('slow');
      setTimeout(function() {
       $('div#forgot2').fadeIn();
       }, 1000);
     }
   })
   .catch(function(err){
     console.log(err);
     Notification.error("Server error");
   });
  };


// Support functions

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
    $('div#allTemplates').fadeOut('slow');
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

// Switching views

  $scope.forgotPwd = function(){
    $('div#allTemplates').show();
    $('div#login-wrap').hide();
    $('div#myModal1').hide();
    $("#myCheck").prop("checked", false);
    $("#pass").prop("type", "password");
    $('div#newOrganisationInfo').hide();
    $('div#newUserInfo').hide();
    $('div#verEmailSent').hide();
    $('div#forgot2').hide();
    $scope.note = "Back to log in";
    $scope.note2 = "Recover password";
    $('div#alert2').fadeOut('slow');
    setTimeout(function() {
     $('div#forgot1').fadeIn('slow');
     }, 1000);
  };

  $scope.registerNew = function(){
    $('div#allTemplates').show();
    $('div#login-wrap').hide();
    $('div#myModal1').hide();
    $("#myCheck").prop("checked", false);
    $("#pass").prop("type", "password");
    $('div#forgot1').hide();
    $('div#newUserInfo').hide();
    $('div#verEmailSent').hide();
    $('div#forgot2').hide();
    $scope.note = "Back to log in";
    $scope.note2 = "Registration form";
    $('div#alert2').fadeOut('slow');
    setTimeout(function() {
     $('div#newOrganisationInfo').fadeIn('slow');
     }, 1000);
  };

  $scope.backToLogin = function(){
    $('div#allTemplates').show();
    $('div#newOrganisationInfo').hide();
    $('div#myModal1').hide();
    $("#myCheck").prop("checked", false);
    $("#pass").prop("type", "password");
    $('div#forgot1').hide();
    $('div#newUserInfo').hide();
    $('div#verEmailSent').hide();
    $('div#forgot2').hide();
    $scope.note = "Register new company";
    $scope.note2 = "Log in to start your session";
    $('div#alert2').fadeOut('slow');
    setTimeout(function() {
     $('div#login-wrap').fadeIn('slow');
     }, 1000);
  };

// Toggle Show/Hide password =================================

  (function ($) {
    $.toggleShowPassword = function (options) {
        var settings = $.extend({
            field: "#password",
            control: "#toggle_show_password",
        }, options);

        var control = $(settings.control);
        var field = $(settings.field);

        control.bind('click', function () {
            if (control.is(':checked')) {
                field.prop('type', 'text');
                field.prop('autocomplete', 'off');
            } else {
                field.prop('type', 'password');
            }
        });
    };
  }(jQuery));

  $.toggleShowPassword({
    field: '#pass',
    control: '#myCheck'
  });

}])

// ==== recoverPasswordController controller ========

.controller('recoverPasswordController',
           ['$scope', '$stateParams', 'AuthenticationService', 'Notification', 'configuration',
           function ($scope, $stateParams, AuthenticationService, Notification, configuration){

   $('div#recoverTmp').show();
   $('div#emailSentTmp').hide();
   $scope.password1 = "";
   $scope.password2 = "";
   $scope.baseHref = configuration.baseHref + '/#/login';

   $scope.resetMyPwd = function(){
     if($scope.password1 === $scope.password2){
       var data = {password : $scope.password1};
       AuthenticationService.resetPwd($stateParams.userId, data)
          .then(function(response){
              $('div#recoverTmp').hide();
              setTimeout(function() {
                $('div#emailSentTmp').fadeIn('slow');
              }, 1000);
            })
            .catch(function(err){
              console.log(err);
              Notification.error("Server error");
            }
          );
        }else{
          Notification.warning("Passwords not matching");
          $scope.password1 = "";
          $scope.password2 = "";
        }
      };

}]);
