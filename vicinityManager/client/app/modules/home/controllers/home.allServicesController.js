'use strict';
angular.module('VicinityManagerApp.controllers')
.controller('allServicesController',
   function ($scope, $window, itemsAPIService, commonHelpers, itemsHelpers, tokenDecoder, searchAPIService, Notification){

// ====== Triggers window resize to avoid bug =======
     commonHelpers.triggerResize();

     // Ensure scroll on top onLoad
         $window.scrollTo(0, 0);

// Initialize variables and get initial data =============

       $scope.items=[];
       $scope.loaded = false;
       $scope.loadedPage = false;
       $scope.noItems = true;
       $scope.myId = $window.sessionStorage.companyAccountId;
       $scope.myUserId = $window.sessionStorage.userAccountId;
       $scope.offset = 0;
       $scope.allItemsLoaded = false;
       $scope.filterNumber = 7;
       $scope.typeOfItem = "services";
       $scope.header = "All Services";
       $scope.canRequestService = false;
       $scope.isCollapsed = true;
       // Ontology search
       $scope.itemType = "all"; // Store user selection
       $scope.ontologyTypes = {}; // Store ontology types
       $scope.itemFilter = {};

       var payload = tokenDecoder.deToken();
       for(var i in payload.roles){
         if(payload.roles[i] === 'infrastructure operator'){
           $scope.canRequestService = true;
         }
       }

       init();

      function init(){
        $scope.loaded = false;
        itemsAPIService.getAllItems($window.sessionStorage.companyAccountId, 'service', $scope.offset, $scope.filterNumber)
        .then(
          function successCallback(response){
            for(var i = 0; i < response.data.message.length; i++){
              for(var j = 0; j < response.data.message[i].hasContracts.length; j++){
                if(response.data.message[i].hasContracts[j].contractingUser){
                  if(response.data.message[i].hasContracts[j].contractingUser.toString() === $scope.myUserId.toString()) response.data.message[i].contracted += 1;
                }
              }
                $scope.items.push(response.data.message[i]);
            }
            $scope.noItems = ($scope.items.length === 0);
            $scope.allItemsLoaded = response.data.message.length < 12;
            return searchAPIService.getOntologyTypes();
          })
          .then(function(response){
            // $scope.ontologyTypes.devices = response.data.message.data["device-hierarchy"];
            $scope.ontologyTypes.services = response.data.message.data["service-hierarchy"];
            // $scope.ontologyTypes.properties = response.data.message.data["property-hierarchy"];
            itemFilter($scope.itemType);
            $scope.loaded = true;
            $scope.loadedPage = true;
          })
          .catch(function(err){
            console.log(err);
            Notification.error("Server error");
          });
      }


// Refresh scope

$scope.refresh = function(value){
  $scope.items=[];
  $scope.loaded = false;
  $scope.itemType = value;
  itemFilter($scope.itemType);
   itemsAPIService.getAllItems($scope.myId, "service", $scope.offset, $scope.filterNumber, addSubclasses($scope.itemType))
   .then(function(response){
     for(var i = 0; i < response.data.message.length; i++){
       for(var j = 0; j < response.data.message[i].hasContracts.length; j++){
         if(response.data.message[i].hasContracts[j].contractingUser){
           if(response.data.message[i].hasContracts[j].contractingUser.toString() === $scope.myUserId.toString()) response.data.message[i].contracted += 1;
         }
       }
         $scope.items.push(response.data.message[i]);
     }
     $scope.noItems = ($scope.items.length === 0);
     $scope.allItemsLoaded = response.data.message.length < 12;
     $scope.loaded = true;
     $scope.loadedPage = true;
     if($scope.itemType !== "all") {
       $scope.header = $scope.header + "  with type: <" + $scope.itemType + ">";
     } else {
       changeHeader($scope.filterNumber);
     }
   })
   .catch(function(err){
     console.log(err);
     Notification.error("Server error");
   });
};

  // Filters items

  $scope.filterItems = function(n){
      $scope.filterNumber = n;
      $scope.offset = 0;
      changeHeader(n);
      $scope.refresh($scope.itemType);
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
            $scope.header = "My " + $scope.typeOfItem + " for friends";
            break;
        case 3:
            $scope.header = "My public " + $scope.typeOfItem;
            break;
        case 4:
            $scope.header = "My " + $scope.typeOfItem;
            break;
        case 5:
            $scope.header = "All " + $scope.typeOfItem + " for friends";
            break;
        case 6:
            $scope.header = "All public " + $scope.typeOfItem;
            break;
        case 7:
            $scope.header = "All " + $scope.typeOfItem;
            break;
        default:
            $scope.header = "All " + $scope.typeOfItem;
            break;
          }
      }

      /* Item filter */
      function itemFilter(value){
        var array = $scope.ontologyTypes.services;
        var exitLoop = false;
        var result = {};
        if(value === "all") value = "core:Service";
        try{
          while(!exitLoop){
            exitLoop = array.class === value;
            if(!exitLoop){
              var innerArray = array["sub-classes"];
              result = innerSubClass(innerArray, value);
              exitLoop = true;
            } else {
              result.path = array.path;
              result.subclasses = getSubclasses(array);
              result.class = array.class;
            }
          }
        } catch(err){
          result.subclasses = [];
          result.subclasses.push("all");
          result.class = "core:Service";
          result.path = ["core:Service"];
          console.log(err);
          Notification.warning("Problem fetching ontology classes");
        }
        $scope.itemFilter = result;
      }

      /* Search nested subclass arrays */
      function innerSubClass(innerArray, value){
        var result = {};
        var innerLength = innerArray.length;
        var cont = 0;
        while(!result.finish && cont < innerLength){
          if(innerArray[cont].class === value){
            result.path = innerArray[cont].path;
            result.subclasses = getSubclasses(innerArray[cont]);
            result.class = innerArray[cont].class;
            result.finish = true;
          } else if(innerArray[cont].hasOwnProperty("sub-classes")) {
            result = innerSubClass(innerArray[cont]["sub-classes"], value);
            cont++;
          } else {
            cont++;
            // Case class not found
            if(cont === innerLength){
              result.subclasses = [];
              result.subclasses.push("all");
            }
          }
        }
        return result;
      }

      /* When proper class is found, get lower level to build filter */
      function getSubclasses(innerArray){
        var classes = [];
        if(innerArray.hasOwnProperty("sub-classes")){
          for( var i = 0, l = innerArray["sub-classes"].length; i < l; i++){
            classes.push(innerArray["sub-classes"][i].class);
          }
        }
        classes.push("all");
        return classes;
      }

      /* Returns items that need to be sent to the server filter */
      function addSubclasses(value){
        if(value === "all") return ["all"];
        try{
          return $scope.itemFilter.subclasses.concat([value]);
        } catch(err){
          console.log(err);
          Notification.warning("Problem fetching ontology classes");
          return ["all"];
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
