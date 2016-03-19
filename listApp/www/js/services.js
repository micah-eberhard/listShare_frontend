angular.module('listShare.services', [])

.service('apiURL', function () {
  return {
    url: "http://localhost:3000"
  };
})

.service('socketURL', function () {
  return {
    url: "http://localhost:2500"
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
    getLists: function() {
      return $http.get(apiURL.url + '/lists')
        .then(function(response) {
          return response;
        }, function(err) {
          // console.log('service errors');
          console.log(err);
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

.factory('Lists', function(apiInterface) {

  var lists = [];


  return {
    setLists: function(data) {
      try
      {
        lists = data;
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
      var socket = io.connect(socketURL.url, {
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
        if(data.location === 'lists')
        {
          apiInterface.getLists()
          .then(function(res){
            if (res.data.success)
            {
              Lists.setLists(res.data.data);
              if($location.path() === '/tab/lists')
                $state.go($state.current, {}, {reload: true});
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
