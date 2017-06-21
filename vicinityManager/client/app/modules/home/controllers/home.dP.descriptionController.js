angular.module('VicinityManagerApp.controllers')
.controller('dPdescriptionController',
function ($scope, $window, $stateParams, itemsAPIService, Notification) {

  $scope.loaded = false;
  $scope.isMyDevice = false;
  $scope.device = {};
  $scope.devInfo = {};
  $scope.devEnabled = '';


  initData();

  function initData(){
    itemsAPIService.getItemWithAdd($stateParams.deviceId)
      .then(
        function successCallback(response){
          updateScopeAttributes(response);
          $scope.loaded = true;
        },
        function errorCallback(response){
        }
      );
    }

    function updateScopeAttributes(response){
        $scope.device = response.data.message;
        $scope.devInfo = response.data.message.info;
        $scope.devEnabled = ($scope.device.status === 'enabled');
        $scope.isMyDevice = ($window.sessionStorage.companyAccountId.toString() === response.data.message.hasAdministrator[0]._id.toString());
        loopObj($scope.devInfo);
    }

    function loopObj(arr){
      var ind = 10;
      var txt = '<div class="panel panel-primary">';
      for (var i in arr) {
        var keyword = new RegExp('object');
        if (!keyword.test(arr[i])){
          txt += '<p class="panel-heading" style="margin: ' + ind + 'px"><b>' + i + ':   </b>' + arr[i] + '</p>';
        }
        else{
          txt += '<p class="panel-heading" style="margin: ' + ind + 'px"><b>' + i + ':  </b>';
          txt += '<a data-toggle="collapse" data-target="#lvl1' + i + '"><i style="color: white" class="fa fa-plus-square pull-right"></i></a></p>';
          txt += '<div id="lvl1' + i + '" class="collapse">';
          txt = innerObj(arr[i],txt,ind);
          txt += '</div>'
          if(ind>10){ind -= 10}
        }
      }
      txt += '</div>';
      $(".rootElem").append(txt);
    }

    function innerObj(arr,txt,ind){
      ind += 10;
      for (var i in arr) {
        var keyword = new RegExp('object');
        if (!keyword.test(arr[i])){
          txt += '<p class="panel-body" style="margin: ' + ind + 'px"><b>' + i + ':   </b>' + arr[i] + '</p>';
        }
        else{
          if(i.length <= 1){
            var aux = 'Property  ' + (Number(i) + 1) ;
          }else{
            var aux = i;
          }
          txt += '<div class="panel panel-info" style="margin: ' + ind + 'px"><p class="panel-heading" style="margin: 10px"><b>' + aux + '</b>';
          txt += '<a data-toggle="collapse" data-target="#lvl2' + i + '"><i style="color: white" class="fa fa-plus-square pull-right"></i></a></p>';
          txt += '<div id="lvl2' + i + '" class="collapse">'
          txt = innerObj(arr[i],txt,ind);
          txt += '</div>';
          txt += '</div>';
        }
      }
      if(ind>0){ind -= 10}
      return txt;
    }

});
