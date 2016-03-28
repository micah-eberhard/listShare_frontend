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
  vm.addList = function(name, recipients){
    var listObj ={
      name: name,
      recipients: recipients
    };
    apiInterface.addList(listObj)
  };
  vm.addRecipient = recipientHandler;

  function recipientHandler(email, list)
  {
    apiInterface.addRecipient(email, list)
    .then(function(res){
      if(res.success)
      {
        console.log("Added " + email);
      }
      else {
        console.log("Failed to add " + email);
      }
    });
  }

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
    if(true)
    {
      currSocket
      .removeAllListeners('update_lists')
      .on('update_lists', updateLists);
    }
  }
  function updateLists(data) {
    console.log("Got Emit: "+ data.location);
    if(data.location === 'lists')
    {
      //console.log(data);
      apiInterface.getLists()
      .then(function(res){
        if (res.data.success)
        {
          Lists.setLists(res.data.data);
          if(data.list)
          {
            if(data.list.type === 'new')
            {
              console.log("New List: "+data.list);
              vm.lists.push(data.list);
            }
            else {
              //vm.lists = Lists.getAll();
              var found = false;
              for(var i=0; i < vm.lists.length && !found; i++)
              {
                //console.log(i);
                if(vm.lists[i].id === parseInt(data.id))
                {
                  console.log("Found");
                  if(data.list !== 'other')
                    vm.lists.splice(i, 1, data.list);
                  else
                  {
                    vm.lists.splice(i,1);
                  }
                  found = true;
                }
              }
            }
          }
          else if (data.item)
          {
            currSocket.emit('push_list_single', data);
          }
          else {
            vm.lists = Lists.getAll();
          }
        }
        else {
          console.log(res.data.reason);
        }

      });
    }
  }
})

.controller('ListDetailCtrl', function($scope, $stateParams, Lists, CheckLogin, socketService, apiInterface, friendService) {
  var vm = this;
  vm.verify = CheckLogin.check;
  $scope.list = Lists.get($stateParams.listId);
  vm.resetError = function(){
    delete vm.error;
  };
  vm.getFriends = function(){
    return friendService.get();
  };

  vm.addItem = function(item)
  {
    apiInterface.addItem(item)
    .then(function(res){
      delete vm.error;
      if(res.data.success)
        console.log("Item Added");
      else
      {
        vm.error = res.data.reason;
        console.log("Item failed to add.");
      }
    });
  };
  vm.updateItem = function(item){
    Lists.updateItem(item);
    };

    vm.addRecipient = recipientHandler;

    function recipientHandler(email, list)
    {
      apiInterface.addRecipient(email, list)
      .then(function(res){
        delete vm.error;
        if(res.data.success)
        {
          console.log("Added " + email);
        }
        else {
          vm.error = res.data.reason;
          console.log("Failed to add " + email);
        }
      });
    }

    var currSocket = socketService.getSocket(); //= socketService.getSocket();

      currSocket
      .removeAllListeners('push_list_single')
      .on('push_list_single', function(data){

        console.log("Single Item *******");
        var found = false;
        for(var i=0; i < $scope.list.items.length && !found; i++)
        {
          //console.log(i);
          if($scope.list.items[i].id === data.item.id)
          {
            console.log("Found");
            //$scope.list.items.splice(i, 1, data.item);
            $scope.list.items[i].name = data.item.name;
            $scope.list.items[i].amount = data.item.amount;
            $scope.list.items[i].price = data.item.price;
            $scope.list.items[i].searching = data.item.searching;
            $scope.list.items[i].acquired = data.item.acquired;
            $scope.list.items[i].category = data.item.category;
            found = true;
          }
        }
        if(!found && $scope.list.id === data.id)
        {
          $scope.list.items.push(data.item);
        }
      });
})

.controller('FriendsCtrl', function($scope, CheckLogin, apiInterface, friendService) {
  var vm = this;
  vm.verify = CheckLogin.check;
  vm.friendList = [];

  vm.addFriend = function(email){
    apiInterface.addFriend(email)
    .then(function(res){
      delete vm.error;
      if(res.data.success)
      {
        vm.refreshFriends();
      }
      else
      {
        vm.error = res.data.reason;
        console.log(res.data.reason);
      }
    });
  };
  vm.refreshFriends = function(){
    friendService.refresh()
    .then(function(res){
      if(res.success)
        vm.friendList = friendService.get();
    });
  };

  vm.friendList = friendService.get();
  if(vm.friendList.length <= 0)
    vm.refreshFriends();


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
