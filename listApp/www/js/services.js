angular.module('listShare.services', [])

.service('apiURL', function () {
  return {
    url: "http://159.203.238.130:3000"
  };
})

.service('socketURL', function () {
  return {
    url: "http://159.203.238.130:2500"
  };
})


.service("AuthInterceptor", function($location, $q) {
  return {
    request: function(config) {
      // prevent browser bar tampering for /api routes
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      var token = localStorage.getItem("token");
      if (token)
        config.headers.Authorization = 'Bearer ' + token;
      return $q.resolve(config);
    },
    responseError: function(err) {
      // if you mess around with the token, log them out and destroy it
      if (err.data === "invalid token" || err.data === "invalid signature" || err.data === "jwt malformed") {
        $location.path("/account");
        return $q.reject(err);
      }
      // if you try to access a user who is not yourself
      if (err.status === 401) {
        $location.path("/account");
        return $q.reject(err);
      }
      return $q.reject(err);
    }
  };
})

.service("authService", function ($http, apiURL) {
  return {
    login: function(email, password) {
      var data = {
        email: email,
        password: password
      };
      return $http.post(apiURL.url + '/login', data)
        .then(function(response) {
          // console.log('success response');
          return response;
        }, function(err) {
          // console.log('service errors');
          console.log(err);
        });
    },
    register: function(email, password, firstName, lastName) {
      var data = {
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName
      };
      return $http.post(apiURL.url + '/signup', data)
        .then(function(response) {
          // console.log('success response');
          return response;
        }, function(err) {
          // console.log('service errors');
          console.log(err);
        });
    }
  };
})

.service('CheckLogin', function($location, $state, socketService){

  return{
    check: function(){
      console.log($location.path());
      if(localStorage.getItem('token'))
      {
        if(!socketService.checkConnect())
        {
          var inToken = localStorage.getItem('token');
          socketService.connect_socket(inToken);
        }
        return true;
      }
      else
      {
        if($location.path() !== '/tab/account')
          $state.go('tab.account')
        return false;
      }
    }
  };
})

.service('apiInterface', function($http, apiURL){

  return {
    addList: function(list) {
      return $http.post(apiURL.url + '/lists', list)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    getLists: function() {
      return $http.get(apiURL.url + '/lists')
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    addRecipient: function(email, list) {
      return $http.post(apiURL.url + '/lists/addrecipient/'+list.id, {email:email})
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    getItems: function(listID) {
      return $http.get(apiURL.url + '/items/' + listID)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    addItem: function(item) {
      //console.log(item);
      return $http.post(apiURL.url + '/items/' + item.list_id, item)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    updateItem: function(item) {

      //console.log(item);
      return $http.post(apiURL.url + '/items/' + item.list_id + '/' + item.id, item)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    deleteItem: function(item) {

      //console.log(item);
      return $http.delete(apiURL.url + '/items/' + item.id)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    },
    addFriend: function(email) {
      //console.log(item);
      return $http.post(apiURL.url + '/friends/', {email:email})
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
          //err.success = false;
          //return err;
        });
    },
    getFriends: function() {
      //console.log(item);
      return $http.get(apiURL.url + '/friends')
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
          //err.success = false;
          //return err;
        });
    },
    removeFriend: function(friend_id) {
      //console.log(item);
      return $http.delete(apiURL.url + '/friends/' + friend_id)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
          //err.success = false;
          //return err;
        });
    },
    deleteList: function(id) {
      return $http.delete(apiURL.url + '/lists/'+id)
        .then(function(response) {
          return response;
        }, function(err) {
          console.log(err);
        });
    }
  };
})

.service('friendService', function(apiInterface){
  var friendList = [];

  return {
    get : function(){
      return friendList;
    },
    refresh : function(){
      return apiInterface.getFriends()
        .then(function(res){
          if(res.data.success)
          {
            friendList = res.data.data;
            return {success:true};
          }
          else {
            return {success:false};
          }
        })
    }
  }
})

.factory('Lists', function(apiInterface) {
  var lists = [];

  return {
    setLists: function(data) {
      try
      {
        lists = data;
        for(var i=0; i < lists.length; i++)
        {
          buildItemList(lists, i, apiInterface);
        }
        return {success:true};
      }
      catch(e)
      {
        return {success:false, reason:e};
      }
    },
    getAll: function() {
      return lists;
    },
    updateItem: function(item) {
      console.log("Found change at: " + item.list_id);
      //console.log(item);
      apiInterface.updateItem(item);
    },
    remove: function(list) {
      apiInterface.deleteList(list.id);
    },
    get: function(listId) {
      for (var i = 0; i < lists.length; i++) {
        if (lists[i].id === parseInt(listId)) {
          return lists[i];
        }
      }
      return null;
    }
  };
})

/*Socket creator and handler*/
.service('socketService', function(socketURL, apiInterface, Lists, $location, $state){
  var isConnected = false;
  var currentSocket;
  var socket;

  return {
    checkConnect : function(){
      return isConnected;
    },
    getSocket : function(){
      if (isConnected)
        return currentSocket;
      else
        return false;
    },
    connect_socket : function(token) {
      //console.log("Starting connect");
      socket = io.connect(socketURL.url, {
        query: 'token=' + token
      });

      socket
      .on('connect', function () {
        console.log('authenticated');
        isConnected = true;
        //socket.emit('userID', {item:'lists', update:'23134', data:{item:'23432', name:'steak'}}); //send the jwt
      })
      .on('disconnect', function () {
        isConnected = false;
        currentSocket = false;
        console.log('disconnected');
      })
      .on('test', function (data) {
        console.log(data);
      })
      .on('update', function (data) {
        if(data.location === 'all')
        {
          apiInterface.getLists()
          .then(function(res){
            if (res.data.success)
            {
              Lists.setLists(res.data.data);
              socket.emit('push_lists', {success:true});
              // var routeCheck = $location.path().split('/');
              // var routeGood = false;
              // if(routeCheck[0] === '')
              //   routeCheck.splice(0,1);
              // if(routeCheck[0] === 'tab' && routeCheck[1] === 'lists')
              //   routeGood = true;
              // //if($location.path() === '/tab/lists')
              // if(routeGood)
              //   $state.go($state.current, {}, {reload: true});
            }
            else {
              console.log(res.data.reason);
            }

          });
        }
      });

      currentSocket = socket;
    }
  };
});


function buildItemList(lists, i, apiInterface){
  var list = lists[i];
  //console.log(i);
  apiInterface.getItems(list.id)
  .then(function(itemData){
    //console.log(itemData);
    if(itemData.data.success)
    {
      list.items = itemData.data.data;

      list.stats = {};
      var avgCost = 0;
      var totalCost = 0;
      var shareSplit = {};

      for(var k=0; k < list.items.length; k++){
        if(list.items[k].acquired)
        {
          totalCost = totalCost + list.items[k].price;
        }

        if(shareSplit[list.items[k].acquired])
          shareSplit[list.items[k].acquired] += list.items[k].price;
        else if (list.items[k].acquired !== null)
          shareSplit[list.items[k].acquired] = list.items[k].price;
      }
      avgCost = totalCost/list.items.length;

      list.stats.avgCost = avgCost;
      list.stats.totalCost = totalCost;
      list.stats.shareSplit = shareSplit;
      //console.log(i);
    }
    else {
      console.log(itemData.data.reason);
    }
  });

}
