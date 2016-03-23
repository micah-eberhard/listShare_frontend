angular.module('listShare.controllers', [])

.controller('HomeCtrl', function($scope) {
  var vm = this;
  console.log("home");
})

.controller('ListsCtrl', function($scope, Lists, CheckLogin, socketService, apiInterface) {
  var vm = this;
  vm.verify = CheckLogin.check;
  vm.lists = Lists.getAll();
  vm.remove = function(list) {
    Lists.remove(list);
  };

  var currSocket = socketService.getSocket();

  var tryConnect = setInterval(function() {
    if(currSocket === false)
    {
      console.log("Attempt Socket");
      currSocket = socketService.getSocket();
    }
    else {
      stopInterval(tryConnect);
    }
  }, 300);

  function stopInterval(currInterval)
  {
    //console.log(currSocket);
    clearInterval(currInterval);
    currSocket
    .on('update', function (data) {
      if(data.location === 'lists')
      {
        console.log(data);
        apiInterface.getLists()
        .then(function(res){
          if (res.data.success)
          {
            Lists.setLists(res.data.data);
            if(!data.item)
              vm.lists = Lists.getAll();
            else
              currSocket.emit('push_list_single', data);//<<<Do something here
          }
          else {
            console.log(res.data.reason);
          }

        });
      }
    });

    // currSocket.on('push_lists', function(data){
    //   console.log("Refresh Lists");
    //   vm.lists = Lists.getAll();
    //   currSocket.emit('push_list_single', {success:true});
    // });
  }
})

.controller('ListDetailCtrl', function($scope, $stateParams, Lists, CheckLogin, socketService) {
  var vm = this;
  vm.verify = CheckLogin.check;

  $scope.list = Lists.get($stateParams.listId);

  vm.updateItem = function(item){
    Lists.updateItem(item);
    };


    var currSocket = socketService.getSocket(); //= socketService.getSocket();

      currSocket
      .on('push_list_single', function(data){
        console.log("Single List");
        console.log($scope.list);
        var found = false;
        for(var i=0; i < $scope.list.items.length && !found; i++)
        {
          //console.log(i);
          if($scope.list.items[i].id === data.item.id)
          {
            console.log('found***');
            $scope.list.items.splice(i, 1, data.item);
            found = true;
          }
        }
        //$scope.list = Lists.get($stateParams.listId);
      });
      // .on('update', function (data) {
      //   if(data.location === 'lists')
      //   {
      //     apiInterface.getLists()
      //     .then(function(res){
      //       if (res.data.success)
      //       {
      //         Lists.setLists(res.data.data);
      //         vm.lists = Lists.getAll();
      //       }
      //       else {
      //         console.log(res.data.reason);
      //       }
      //
      //     });
      //   }
      // });
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
