'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('homeController',
            ['$rootScope', '$scope', '$window', 'Base64','tokenDecoder', 'commonHelpers', '$interval', 'userAccountAPIService',
            function ($rootScope, $scope, $window, Base64, tokenDecoder, commonHelpers, $interval, userAccountAPIService) {

  // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

  // Checks if it is necessary to display goToTop
  $interval(checkScroll, 1000);

  /*
  Initializes skin color based on skinColor field in useraccounts MONGO schema
  */
  $rootScope.styles = ['hold-transition', 'skin-blue', 'sidebar-mini'];
  $rootScope.skinColor = 'blue'; //Default on error
  $rootScope.myColor = 'my-blue';
  $rootScope.bckColor = 'bck-blue';
  userAccountAPIService.getConfigurationParameters($window.sessionStorage.companyAccountId)
    .then(
      function successCallback(response){
        if(response.data.message.skinColor){
          $rootScope.skinColor = response.data.message.skinColor;
          $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
          $rootScope.myColor = 'my-' + $rootScope.skinColor;
          $rootScope.bckColor = 'bck-' + $rootScope.skinColor;
        } else {
          $rootScope.skinColor = 'blue'; //Default on error
          $rootScope.styles = ['hold-transition', 'skin-blue', 'sidebar-mini'];
          $rootScope.myColor = 'my-blue';
          $rootScope.bckColor = 'bck-blue';
        }
      },
      function errorCallback(err){
        console.log(err);
        $rootScope.skinColor = 'blue'; //Default on error
        $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
        $rootScope.myColor = 'my-' + $rootScope.skinColor;
        $rootScope.bckColor = 'bck-' + $rootScope.skinColor;
      }
    );


    // Initializes variables and resources

    $scope.isDev = false;
    $scope.isInfOp = false;
    $scope.isScrollable = false;
    $scope.isAdmin = false;
    $scope.isIntegrator = false;

    var myInit = function(){
      var payload = tokenDecoder.deToken();

      for(var i in payload.roles){
        if(payload.roles[i] === 'devOps'){
          $scope.isDev = true;
        }
        if(payload.roles[i] === 'infrastructure operator'){
          $scope.isInfOp = true;
        }
        if(payload.roles[i] === 'device owner'){
          $scope.isDevOwn = true;
        }
        if(payload.roles[i] === 'service provider'){
          $scope.isServProv = true;
        }
        if(payload.roles[i] === 'system integrator'){
          $scope.isIntegrator = true;
        }
        if(payload.roles[i] === 'administrator'){
          $scope.isAdmin = true;
        }
      }
    };

    myInit();

    // Scroll to top
    $scope.goToTop = function(){
        $window.scrollTo(0, 0);
    };

    function checkScroll(){
      if( $(window).height() < $(document).height() ) {
        $scope.isScrollable = true;
      } else {
        $scope.isScrollable = false;
      }
    }

  }
]);
