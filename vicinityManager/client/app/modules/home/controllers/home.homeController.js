angular.module('VicinityManagerApp.controllers').
  controller('homeController',
  function ($scope,
            $state,
            $stateParams,
            $window,
            $location,
            $http,
            Notification) {

// Notifications
  $scope.notifyMe = function(){
    Notification.primary('Primary notification');
  } 
  // // Other Options
  // // Success
  // Notification.success('Success notification');
  //
  // // Message with custom type
  // Notification({message: 'Warning notification'}, 'warning');
  //
  // // With Title
  // Notification({message: 'Primary notification', title: 'Primary notification'});
  //
  // // Message with custom delay
  // Notification.error({message: 'Error notification 1s', delay: 1000});
  //
  // // Embed HTML within your message.....
  // Notification.success({message: 'Success notification<br>Some other <b>content</b><br><a href="https://github.com/alexcrack/angular-ui-notification">This is a link</a><br><img src="https://angularjs.org/img/AngularJS-small.png">', title: 'Html content'});
  //
  // // Change position notification
  // Notification.error({message: 'Error Bottom Right', positionY: 'bottom', positionX: 'right'});
  //
  // // Replace message
  // Notification.error({message: 'Error notification 1s', replaceMessage: true});

  });
