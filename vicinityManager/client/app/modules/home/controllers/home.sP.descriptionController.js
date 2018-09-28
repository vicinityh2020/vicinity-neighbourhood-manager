'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('sPdescriptionController',
function ($scope, $window, $stateParams, commonHelpers, itemsAPIService, Notification) {

  // Variables and initData
  // ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

    $scope.loaded = false;
    $scope.isMyItem = false;
    $scope.device = {};
    $scope.devInfo = {};
    $scope.devEnabled = '';


    initData();

    function initData(){
      itemsAPIService.getItemWithAdd($stateParams.serviceId)
      .then(function(response){
        try{
          updateScopeAttributes(response);
          $scope.loaded = true;
        } catch(err){
          console.log(err);
          Notification.error("It was not possible to build the view");
        }
      })
      .catch(function(err){
        console.log(err);
        Notification.error("Server error");
      });
    }

  // Functions and helpers

    /*
    Refreshes/loads data into $scope
    */
      function updateScopeAttributes(response){
          $scope.device = response.data.message[0];
          $scope.devInfo = $scope.device.info;
          $scope.devEnabled = ($scope.device.status === 'enabled');
          $scope.isMyDevice = ($window.sessionStorage.companyAccountId.toString() === $scope.device.cid.id._id.toString());
          loopObj($scope.devInfo);
      }

      /*
      Builds HTML based on item thing description
      Builds the first level
      Nested objects are considered as inner levels
      Stores in the var txt an HTML string
      */
      function loopObj(arr){
        var cont = 0;
        var ind = 10;
        var ans = {};
        var txt = '<div class="panel panel-primary">';
        for (var i in arr) {
          cont += 1;
          var keyword = new RegExp('Object');
          if (!keyword.test(arr[i])){
            txt += '<p class="panel-heading" style="margin: ' + ind + 'px"><b>' + i + ':   </b>' + arr[i] + '</p>';
          }
          else{
            txt += '<p class="panel-heading" style="margin: ' + ind + 'px"><b>' + i + ':  </b>';
            txt += '<a data-toggle="collapse" data-target="#lvl' + cont + '"><i style="color: white" class="fa fa-plus-square pull-right"></i></a></p>';
            txt += '<div id="lvl' + cont + '" class="collapse">';
            ans = innerObj(arr[i],txt,ind,cont);
            txt = ans.key1;
            cont = ans.key2;
            txt += '</div>';
            if(ind>10){ind -= 10;}
          }
        }
        txt += '</div>';
        $(".rootElem").append(txt);  // Appends HTML string in the VIEW
      }

      /*
      Handles iteratively inner levels
      */
      function innerObj(arr,txt,ind,cont){
        var ans = {};
        ind += 10;
        for (var i in arr) {
          cont += 1;
          var keyword = new RegExp('Object');
          if (!keyword.test(arr[i])){
            txt += '<p class="panel-body" style="margin: ' + ind + 'px"><b>' + i + ':   </b>' + arr[i] + '</p>';
          }
          else{
            txt += '<div class="panel panel-info" style="margin: ' + ind + 'px"><p class="panel-heading" style="margin: 10px"><b>' + findElement(arr, i, ind) + '</b>';
            txt += '<a data-toggle="collapse" data-target="#lvl' + cont + '"><i style="color: white" class="fa fa-plus-square pull-right"></i></a></p>';
            txt += '<div id="lvl' + cont + '" class="collapse">';
            ans = innerObj(arr[i],txt,ind,cont);
            txt = ans.key1;
            cont = ans.key2;
            txt += '</div>';
            txt += '</div>';
          }
        }
        if(ind>0){ind -= 10;}
        return {key1: txt, key2: cont};
      }

      /*
      Renames lvl headers when coming from array
      Depending on the level gives a different name
      If it is a property/action gives the pid or aid as a name (If there is no pid/aid gives a number)
      For lower levels gives the key of the array as the name
      */
      function findElement(obj, pos, lvl){
        if(lvl === 20){
          if(obj[pos].pid){
            return obj[pos].pid;
          } else if(obj[pos].aid) {
            return obj[pos].aid;
          } else {
            return 'Attribute ' + Number( pos + 1 );
          }
        } else {
          return pos;
        }
      }

  });
