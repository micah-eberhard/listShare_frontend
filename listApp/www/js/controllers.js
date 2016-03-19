angular.module('listShare.controllers', [])

.controller('HomeCtrl', function($scope) {
  var vm = this;
  console.log("home");
})

.controller('ListsCtrl', function($scope, Lists, CheckLogin) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  var vm = this;
  vm.verify = CheckLogin.check;

  vm.lists = Lists.getAll();
  vm.remove = function(list) {
    Lists.remove(list);
  };
})

.controller('ListDetailCtrl', function($scope, $stateParams, Lists, CheckLogin) {
  //var vm = this;
  $scope.list = Lists.get($stateParams.listId);
})

.controller('FriendsCtrl', function($scope, CheckLogin) {
  var vm = this;
  vm.verify = CheckLogin.check;
})

.controller('AccountCtrl', function($scope, $location, $state, CheckLogin, authService, socketService) {
  var vm = this;

  vm.login = loginHandler;
  vm.register = registerHandler;
  vm.logout = logoutHandler;

  vm.showProfile = false;
  vm.verify = CheckLogin.check;

  console.log("Logged in?: " + vm.showProfile);

  vm.settings = {
    enableFriends: true
  };


  function loginHandler (email, password)
  {
    authService.login(email, password).then(function(response) {
      localStorage.setItem('token', response.data.token);
      //console.log(localStorage.token);
      //vm.showProfile = CheckLogin.check();
      $state.go('tab.lists');
    });
  }

  function registerHandler (email, password, fname, lname)
  {
    authService.register(email, password, fname, lname).then(function(response) {
      //console.log(localStorage.token);
      $state.go($state.current, {}, {reload: true});
    });
  }

  function logoutHandler()
  {
    localStorage.removeItem('token');
    socketService.getSocket().disconnect();
    vm.verify = CheckLogin.check();
    $state.go($state.current, {}, {reload: true});
  }


});
