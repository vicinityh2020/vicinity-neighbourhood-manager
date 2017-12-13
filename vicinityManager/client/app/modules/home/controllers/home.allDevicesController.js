'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allDevicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers, searchAPIService, Notification, $q){

// ====== Triggers window resize to avoid bug =======
    commonHelpers.triggerResize();

// Ensure scroll on top onLoad
    $window.scrollTo(0, 0);

// Initialize variables and get initial data =============

   $scope.devs=[];
   $scope.onlyPrivateDevices = false;
   $scope.noItems = true;
   $scope.loaded = false;
   $scope.loadedPage = false;
   $scope.myId = $window.sessionStorage.companyAccountId;
   $scope.offset = 0;
   $scope.allItemsLoaded = false;
   $scope.filterNumber = 7;
   $scope.typeOfItem = "devices";
   $scope.header = "All Devices";
   $scope.isCollapsed = true;
   // Semantic repository filters
   $scope.ontologyProperties = {};
   $scope.ontologyDevType = {};
   $scope.oidsForPropertyFilter = [];
   $scope.oidsForDevTypeFilter = [];
   $scope.oidsFilter = [];

   init();
   initRepositoryPropFilters();
   initRepositoryDevFilters();

   function init(){
     $scope.loaded = false;
      itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, "device", $scope.offset, $scope.filterNumber, $scope.oidsFilter)
      .then(function(response){
        for(var i = 0; i < response.data.message.length; i++){
            $scope.devs.push(response.data.message[i]);
        }
        $scope.noItems = ($scope.devs.length === 0);
        $scope.allItemsLoaded = response.data.message.length < 12;
        $scope.loaded = true;
        $scope.loadedPage = true;
      })
      .catch(function(err){
        Notification.error(err);
      });
  }

  function initRepositoryPropFilters(){
    return $q(function(resolve, reject) {
     searchAPIService.getSubclass("ssn:Property")
     .then(function(response){
       $scope.ontologyProperties = parseRepositoryResponse(JSON.parse(response.data.message).data.results.bindings);
       $scope.oidsForPropertyFilter = [];
       resolve();
     })
     .catch(function(err){
       Notification.error(err);
       reject();
     });
   });
 }

 function initRepositoryDevFilters(){
   return $q(function(resolve, reject) {
     searchAPIService.getSubclass("core:Device")
      .then(function(response){
        $scope.ontologyDevType = parseRepositoryResponse(JSON.parse(response.data.message).data.results.bindings);
        $scope.oidsForDevTypeFilter = [];
        resolve();
      })
      .catch(function(err){
        Notification.error(err);
        reject();
      });
    });
  }

// Manage access request functions =====================

   $scope.processMyAccess = function(dev_id) {
     itemsAPIService.processItemAccess(dev_id)
     .then(itemsHelpers.processingAccess,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
    };

   $scope.cancelMyRequest = function(dev_id) {
     itemsAPIService.cancelItemRequest(dev_id)
     .then(itemsHelpers.cancellingRequest,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
    };

   $scope.cancelMyAccess = function(dev_id) {
     $scope.note = "";
     itemsAPIService.cancelItemAccess(dev_id)
     .then(itemsHelpers.cancellingAccess,itemsHelpers.errorCallback)
     .then(updateScopeAttributes,itemsHelpers.errorCallback);
   };

// Refresh scope

  function updateScopeAttributes(response){
    for (var dev in $scope.devs){
      if ($scope.devs[dev]._id.toString() === response.data.message[0]._id.toString()){
          $scope.devs[dev] = response.data.message[0];
      }
    }
  }

  // Filters items

  $scope.filterItems = function(n){
      var haveFilter = typeof n !== 'undefined' ? true : false;
      if(haveFilter){
        $scope.filterNumber = n;
        changeHeader(n);
      }
      if($scope.oidsForPropertyFilter.length === 0){
        $scope.oidsFilter = $scope.oidsForDevTypeFilter;
      } else if ($scope.oidsForDevTypeFilter.length === 0){
        $scope.oidsFilter = $scope.oidsForPropertyFilter;
      } else {
      $scope.oidsFilter = $scope.oidsForPropertyFilter.filter(  // filter out non repeated elements in both arrays
        function(obj) { return $scope.oidsForDevTypeFilter.indexOf(obj) !== -1; }
      );}
      $scope.offset = 0;
      $scope.devs=[];
      init();
  };

  function changeHeader(n){
    switch (n) {
        case 0:
            $scope.header = "My disabled " + $scope.typeOfItem;
            break;
        case 1:
            $scope.header = "My private " + $scope.typeOfItem;
            break;
        case 2:
            $scope.header = "My shared " + $scope.typeOfItem;
            break;
        case 3:
            $scope.header = "My public " + $scope.typeOfItem;
            break;
        case 4:
            $scope.header = "My " + $scope.typeOfItem;
            break;
        case 5:
            $scope.header = "All shared " + $scope.typeOfItem;
            break;
        case 6:
            $scope.header = "All public " + $scope.typeOfItem;
            break;
        case 7:
            $scope.header = "All " + $scope.typeOfItem;
            break;
          }
      }

  // Ontology Filters

  // The output are the filter values for the selected property
  $scope.getSubclassProp = function(i){
    var lenBefore = $scope.ontologyProperties.class.length;
    var filterSel = $scope.ontologyProperties.class[i];
    if(filterSel !== "ssn:Property"){
      searchAPIService.getSubclass(filterSel)
      .then(function(response){
        $scope.ontologyProperties = parseRepositoryResponse(JSON.parse(response.data.message).data.results.bindings);
        var lenAfter = $scope.ontologyProperties.class.length === 0;
        $scope.ontologyProperties.class.push("ssn:Property");
        $scope.ontologyProperties.value.push(" - Restore default - ");
        return searchAPIService.getAllSubclass(filterSel);
      })
      .then(function(response){
        var aux = parseRepositoryResponse(JSON.parse(response.data.message).data.results.bindings, true);
        aux.push(filterSel);
        return $scope.getOids(aux, "<http://www.w3.org/ns/sosa/observes>", true);
      })
      .then(function(response){
        response.push('Nothing'); // The Nothing possibility always in the array because it is what remains if no OIDs repeated in dev and prop filters
        $scope.oidsForPropertyFilter = response;
        $scope.filterItems();
      })
      .catch(function(err){
        Notification.error(err);
      });
    } else {
      initRepositoryPropFilters()
      .then(function(response){$scope.filterItems();})
      .catch(function(error){Notification.error(error); });
    }
  };

  // The output are the filter values for the selected device type
  $scope.getSubclassDevType = function(i){
    var lenBefore = $scope.ontologyDevType.class.length;
    var filterSel = $scope.ontologyDevType.class[i];
    if(filterSel !== "core:Device"){
      searchAPIService.getSubclass(filterSel)
      .then(function(response){
        $scope.ontologyDevType = parseRepositoryResponse(JSON.parse(response.data.message).data.results.bindings);
        var lenAfter = $scope.ontologyDevType.class.length === 0;
        $scope.ontologyDevType.class.push("core:Device");
        $scope.ontologyDevType.value.push(" - Restore default - ");
        return $scope.getOids(filterSel, "a", false);
      })
      .then(function(response){
        response.push('Nothing');
        $scope.oidsForDevTypeFilter = response;
        $scope.filterItems();
      })
      .catch(function(err){
        Notification.error(err);
      });
    } else {
      initRepositoryDevFilters()
      .then(function(response){$scope.filterItems();})
      .catch(function(error){Notification.error(error); });
    }
  };

  // Retrieves all the OIDs matching the devTypes/properties
  $scope.getOids = function(object, predicate, getGraph){
    return searchAPIService.getOids(object, predicate, getGraph)
    .then(function(response){
      return response.data.message;
    })
    .catch(function(err){
      Notification.error(err);
    });
  };

  function parseRepositoryResponse(arr, onlyClass){
    onlyClass = typeof onlyClass !== 'undefined' ? onlyClass : false;
    try{
      var myTypes = [], myTypesCaption = []; // store types
      var pos_hash = 0, pos_slash = 0; // keeps position in the string where the actual type starts
      var aux = ""; // keeps the value for each iteration
      for(var i=0; i<arr.length; i++){
        aux = arr[i].s.value;
        pos_hash = aux.indexOf('#',0);
        pos_slash = aux.lastIndexOf('/', pos_hash-4);
        myTypes.push(aux.substr(pos_slash + 1).replace("#", ":"));
        myTypesCaption.push(aux.substr(pos_hash+1));
      }
      if(onlyClass === true){
        return(myTypes);
      } else {
        return({class: myTypes, value: myTypesCaption});
      }
    }
    catch(err)
    {
      Notification.error(err);
      return(["ERROR"]);
    }
  }

  // Trigers load of more items

  $scope.loadMore = function(){
      $scope.loaded = false;
      $scope.offset += 12;
      init();
  };

  $scope.collapseFlag = function(){
    $scope.isCollapsed = !($scope.isCollapsed);
  };

});
