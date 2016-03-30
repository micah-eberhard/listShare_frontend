angular.module('listShare.controllers', [])

.controller('HomeCtrl', function($scope) {
  var vm = this;
  console.log("home");
})

.controller('ListsCtrl', function($scope, $timeout, Lists, CheckLogin, socketService, apiInterface) {
  var vm = this;
  vm.verify = CheckLogin.check;
  vm.lists = Lists.getAll();

  if(vm.lists.length <= 0)
  {
    updateLists({location:'lists'});
  }

  vm.remove = function(list) {
    Lists.remove(list);
  };
  var lengthHold = 0;
  var lengthCheck = 0;
  vm.errorList = [];
  vm.addList = function(name, recipients){
    var listObj ={
      name: name,
      recipients: recipients
    };
    apiInterface.addList(listObj)
    .then(function(res){
      vm.errorList = [];
      if(res.data.success)
      {
        $scope.showIndicator({success:true, text: 'List Added'});
        lengthHold = recipients.length;
        lengthCheck = 0;
        for(var i=0; i < recipients.length; i++)
        {
          console.log(res.data);
          apiInterface.addRecipient(recipients[i], res.data)
          .then(function(addRes){
            if(addRes.data.success)
            {
            //  $scope.showIndicator({success:true, text: 'Added'});
              console.log("Added: " + addRes.data.id);
              lengthCheck ++;
            }
            else {
              console.log(addRes.data.reason);
              $scope.showIndicator({error:true, text: addRes.data.reason});
              vm.errorList.push(addRes.data.reason); //Old error push
              lengthCheck ++;
            }
            if(lengthCheck === lengthHold)
            {
              console.log("Errors: ");
              console.log(vm.errorList);
            }
          });
        }
      }
    });
  };
  vm.addRecipient = recipientHandler;

  function recipientHandler(email, list)
  {
    apiInterface.addRecipient(email, list)
    .then(function(res){
      if(res.success)
      {
        //$scope.showIndicator({success:true, text: 'Added'});
        console.log("Added " + email);
      }
      else {
        $scope.showIndicator({error:true, text: "Failed to add " + email});
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


  $scope.data = {
    flash:false,
    msg: {}
  };

  $scope.showIndicator = function(msgObj){
    msgObj.flash = true;
    $scope.data = msgObj;
    $timeout(function() {
      $scope.data = {flash:false, msg: {}};
    }, 2000);
  };
})

.controller('ListDetailCtrl', function($scope, $stateParams, $ionicListDelegate, $timeout, Lists, CheckLogin, socketService, apiInterface, friendService) {
  var vm = this;
  vm.verify = CheckLogin.check;
  $scope.list = Lists.get($stateParams.listId);
  vm.showEdit = {};
  vm.friendList = friendService.get();
  vm.tempFriends = [];

  // vm.checkLog = function(str)
  // {
  //   console.log(str);
  // };
  vm.resetOptions = function(){
    $ionicListDelegate.closeOptionButtons();
  };

  vm.resetError = function(){
    delete vm.error;
  };
  vm.getFriends = function(){
    return friendService.get();
  };

  vm.searchFriends = function(friendCheck)
  {
    var friends = friendService.get();
    vm.tempFriends = [];
    for(var i=0; i < friends.length; i++)
    {
      var match = true;
      for(var j=0; j < friendCheck.length && match; j++)
      {
        if(friendCheck[j].toLowerCase() !== friends[i].email[j].toLowerCase())
        {
          match = false;
        }
        if(j === friendCheck.length -1 && match)
          vm.tempFriends.push(friends[i]);
      }
    }
  };

  vm.addItem = function(item)
  {
    apiInterface.addItem(item)
    .then(function(res){
      delete vm.error;
      if(res.data.success)
      {
        $scope.showIndicator({success:true, text: 'Item Added'});
        console.log("Item Added");
      }
      else
      {
        $scope.showIndicator({error:true, text: res.data.reason});
        //vm.error = res.data.reason;
        console.log("Item failed to add.");
      }
    });
  };
  vm.updateItem = function(item){
    Lists.updateItem(item);
    };
  vm.deleteItem = function(item){
    apiInterface.deleteItem(item)
    .then(function(res){
      console.log(res);
    });
  };

    vm.addRecipient = recipientHandler;

    function recipientHandler(email, list)
    {
      apiInterface.addRecipient(email, list)
      .then(function(res){
        delete vm.error;
        if(res.data.success)
        {
          $scope.showIndicator({success:true, text: (email +' Added')});
          console.log("Added " + email);
        }
        else {
          //vm.error = res.data.reason;
          $scope.showIndicator({error:true, text: res.data.reason});
          console.log("Failed to add " + email);
        }
      });
    }


    var currSocket = socketService.getSocket(); //= socketService.getSocket();

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
        .removeAllListeners('push_list_single')
        .on('push_list_single', updateSingle);
      }
    }

    //var currSocket = socketService.getSocket(); //= socketService.getSocket();

      // currSocket
      // .removeAllListeners('push_list_single')
      // .on('push_list_single', function(data){
      function updateSingle(data){
        console.log("Single Item *******");
        var found = false;
        for(var i=0; i < $scope.list.items.length && !found; i++)
        {
          //console.log(i);
          if($scope.list.items[i].id === data.item.id)
          {
            console.log("Found");
            if(data.item.delete)
            {
              $scope.list.items.splice(i, 1);
            }
            else{
              //$scope.list.items.splice(i, 1, data.item);
              // console.log("Push Update: ");
              // console.log(data);

              $scope.list.items[i].name = data.item.name;
              $scope.list.items[i].list_id = data.item.list_id; // <----- or below, missing data
              $scope.list.items[i].amount = data.item.amount;
              $scope.list.items[i].price = data.item.price;
              $scope.list.items[i].searching = data.item.searching;
              $scope.list.items[i].acquired = data.item.acquired;
              $scope.list.items[i].category = data.item.category;
            }
            found = true;
          }
        }
        if(!found && $scope.list.id === data.id && !data.delete)
        {
          $scope.list.items.push(data.item);
        }
      }


      $scope.data = {
        flash:false,
        msg: {}
      };

      $scope.showIndicator = function(msgObj){
        msgObj.flash = true;
        $scope.data = msgObj;
        $timeout(function() {
          $scope.data = {flash:false, msg: {}};
        }, 2000);
      };
})

.controller('FriendsCtrl', function($scope, $ionicPlatform, $timeout, CheckLogin, apiInterface, friendService) {
  var vm = this;
  vm.verify = CheckLogin.check;
  vm.friendList = [];
  vm.isVisible = false;
  $ionicPlatform.ready(function()
  {
// $scope.remove_padding = "padding-bottom:0px !important;";
    vm.isVisible = true;
    // console.log("Fire");
  });

  vm.removeFriend = function(friend){
    apiInterface.removeFriend(friend.friend_id)
    .then(function(res){
      if(res.data.success)
      {
        for(var j=0; j < vm.friendList.length; j++)
        {
          if(vm.friendList[j].friend_id === friend.friend_id)
          {
            vm.friendList.splice(j, 1);
          }
        }
      }
      else{
        console.log("Failed to remove friend: " + friend.email);
      }
    });
  };
  vm.addFriend = function(email){
    apiInterface.addFriend(email)
    .then(function(res){
      //delete vm.error;
      if(res.data.success)
      {
        $scope.showIndicator({success:true, text: email + " Added"});
        vm.refreshFriends(res.data.friend_id);
      }
      else
      {
        //vm.error = res.data.reason;
        $scope.showIndicator({error:true, text: res.data.reason});
        console.log(res.data.reason);
      }
    });
  };
  vm.refreshFriends = function(friend_id){
    friendService.refresh()
    .then(function(res){
      if(res.success)
      {
        if(friend_id)
        {
          var newList = friendService.get();
          for(var i=0; i < newList.length; i++)
          {
            if(newList[i].friend_id === friend_id)
              vm.friendList.push(newList[i]);
          }
        }
        else {
          vm.friendList = friendService.get();
        }
      }
    });
  };

  vm.friendList = friendService.get();
  if(vm.friendList.length <= 0)
  {
    vm.refreshFriends();

  }


  $scope.data = {
    flash:false,
    msg: {}
  };

  $scope.showIndicator = function(msgObj){
    msgObj.flash = true;
    $scope.data = msgObj;
    $timeout(function() {
      $scope.data = {flash:false, msg: {}};
    }, 2000);
  };


})

.controller('AccountCtrl', function($scope, $location, $state, $timeout, CheckLogin, authService, socketService, apiInterface, Lists) {
  var vm = this;

  vm.login = loginHandler;
  vm.register = registerHandler;
  vm.logout = logoutHandler;

  vm.signup = false;
  vm.showProfile = false;
  vm.verify = CheckLogin.check;


  function loginHandler (email, password)
  {
    authService.login(email, password).then(function(response) {
      if(response.data.success)
      {
        localStorage.setItem('token', response.data.token);

        apiInterface.getLists()
        .then(function(res){
          if (res.data.success)
          {
            Lists.setLists(res.data.data);
            $state.go('tab.lists');
          }
        });
      }
      else {
        $scope.showIndicator({error:true, text: response.data.reason});
        console.log(response.data.reason);
      }
    });
  }

  function registerHandler (email, password, fname, lname)
  {
    authService.register(email, password, fname, lname)
    .then(function(response) {
      //console.log(localStorage.token);
      if(response.data.success)
      {
        $scope.showIndicator({success:true, text: "Registration Successful"});
        //$state.go($state.current, {}, {reload: true});
        vm.signup = false;
      }
      else {
        $scope.showIndicator({error:true, text: response.data.reason});
        console.log(response.data.reason);
      }
    });
  }

  function logoutHandler()
  {
    localStorage.removeItem('token');
    socketService.getSocket().disconnect();
    vm.verify = CheckLogin.check();
    $state.go($state.current, {}, {reload: true});
  }

  $scope.data = {
    flash:false,
    msg: {}
  };

  $scope.showIndicator = function(msgObj){
    msgObj.flash = true;
    $scope.data = msgObj;
    $timeout(function() {
      $scope.data = {flash:false, msg: {}};
    }, 2000);
  };

});
