'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('homeController',
            ['$rootScope', '$scope', '$window', 'Base64','tokenDecoder', 'commonHelpers', '$interval', 'userAccountAPIService',
            function ($rootScope, $scope, $window, Base64, tokenDecoder, commonHelpers, $interval, userAccountAPIService) {

      // ====== Triggers window resize to avoid bug =======
        commonHelpers.triggerResize();

      $interval(checkScroll, 1000); // Checks if it is necessary to display goToTop

      $scope.isDev = false;
      $scope.isInfOp = false;
      $scope.isScrollable = false;

      /*
      Initializes skin color based on skinColor field in useraccounts MONGO schema
      */
      userAccountAPIService.getUserAccountProfile($window.sessionStorage.companyAccountId)
        .then(
          function successCallback(response){
              $rootScope.skinColor = response.data.message.skinColor;
              $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
          },
          function errorCallback(err){
              $rootScope.skinColor = 'blue'; //Default on error
              $rootScope.styles = ['hold-transition', 'skin-' + $rootScope.skinColor, 'sidebar-mini'];
          }
        );

      var myInit = function(){
        var payload = tokenDecoder.deToken();

        for(var i in payload.roles){
          if(payload.roles[i] === 'devOps'){
            $scope.isDev = true;
          }
          if(payload.roles[i] === 'infrastructure operator'){

            $scope.isInfOp = true;
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


}]);
