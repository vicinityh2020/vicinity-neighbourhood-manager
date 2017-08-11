'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('homeController',
            ['$scope', '$window', 'Base64','tokenDecoder', 'commonHelpers', '$interval',
            function ($scope, $window, Base64, tokenDecoder, commonHelpers, $interval) {

      // ====== Triggers window resize to avoid bug =======
        commonHelpers.triggerResize();

      $interval(checkScroll, 1000); // Checks if it is necessary to display goToTop

      $scope.isDev = false;
      $scope.isInfOp = false;
      $scope.isScrollable = false;

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
