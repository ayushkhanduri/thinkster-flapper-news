var app = angular.module('flapperNews',['ui.router']);
app.controller('MainCtrl',['$scope','posts','postPromise','auth',function($scope,posts,postPromise,auth){
    $scope.posts= postPromise.data;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.addPost = function(){
        if($scope.title.trim().length==0){
            return ;
        }
        posts.addPost({
            title: $scope.title,
            link: $scope.link
        }).success(function(data){
            $scope.posts.push(data);
            console.log(data);
        }); 
        $scope.title='';
        $scope.link ='';
    }
    
    $scope.incrementUpvotes = function(obj){
        var result = posts.upvote(obj);
        result.success(function(data){
            obj.upvotes++;
        });
        //obj.upvotes++;
        console.log($scope.posts);
    }
    
}]);

app.controller('PostsCtrl',['$scope','posts','post','auth',function($scope,posts,post,auth){
    $scope.post = post.data;
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.addComments = function(){
        if($scope.body.trim().length==0){
            return ;
        }
        posts.addComments($scope.post._id,
        {
            body: $scope.body,
            author: 'user'
        }).success(function(data){
            console.log(data);
            $scope.post.comments.push(data);
        });
        $scope.body = '';
    };

     $scope.incrementUpvotes = function(obj){
        posts.upvoteComments($scope.post,obj).success(function(data){
            console.log("ASdasdas");
            console.log(obj);
            obj.upvotes++;
        }).error(function(){
        });
    }
    
}]);

app.service('posts',['$http','auth',function($http,auth){
    this.getAll = function(){
        console.log("weeee");
        return $http.get('/posts');
       
    }

    this.addPost = function(post){
        return $http.post('/posts',post,{headers: {Authorization: 'Bearer '+auth.getToken()}});
    }

    this.upvote = function(post){
        //console.log("not found");
        return $http.put('/posts/'+post._id+'/upvote',null,{headers: {Authorization: 'Bearer '+auth.getToken()}});
    }

    this.getComments = function(id){
        console.log(id);
        return $http.get('/posts/'+id);

    }

    this.addComments = function(id,comment){
        console.log("this is the id" + id + " and the comment : "+comment.body + comment.author);
        return $http.post("/posts/"+id+"/comments",comment,{headers: {Authorization: 'Bearer '+auth.getToken()}});

    }

    this.upvoteComments = function(post,comment){
        console.log("asdasdas");
        return $http.put('/posts/'+post._id+'/comments/'+comment._id+"/upvote",null,{headers: {Authorization: 'Bearer '+auth.getToken()}});
    }
}]);

app.controller('AuthCtrl', ['$scope','$state','auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])

app.factory('auth',['$http','$window',function($http,$window){
    var auth = {};
    auth.saveToken = function(token){
        $window.localStorage['flapper-news-token'] = token;
    }

    auth.getToken = function (){
        return $window.localStorage['flapper-news-token'];
    }

    auth.isLoggedIn = function(){
    var token = auth.getToken();

    if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.exp > Date.now() / 1000;
    } else 
    {

        return false;
    }
    };

    auth.currentUser = function(){
    if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));
        return payload.username;
    } 
    };  

    auth.register = function(user){
        return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
    });
    };

    auth.logIn = function(user){
        return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
    });
    };

    auth.logOut = function(){
        $window.localStorage.removeItem('flapper-news-token');
    };

    return auth;

}]);

app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider){
    $stateProvider
    .state('home',{
        url: '/home',
        templateUrl: 'home/home.html',
        controller: 'MainCtrl',
        resolve: { // we query all the data from backend before we actually load the state
            postPromise: ['posts',function(posts){
                console.log (posts.getAll());
                return posts.getAll();
            }]
        }
    })
    .state('posts',{
        url: '/posts/{id}',
        templateUrl: 'home/posts.html',
        controller: 'PostsCtrl',
        resolve: {
            post: ['posts','$stateParams',function(posts,$stateParams){
                console.log(posts.getComments($stateParams.id));
                return posts.getComments($stateParams.id)
            }]
        }
    })
    .state('login', {
        url: '/login',
        templateUrl: 'home/login.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
            $state.go('home');
            }
        }]
    })
    .state('register', {
        url: '/register',
        templateUrl: 'home/register.html',
        controller: 'AuthCtrl',
        onEnter: ['$state', 'auth', function($state, auth){
            if(auth.isLoggedIn()){
            $state.go('home');
            }
        }]
    });
    $urlRouterProvider.otherwise('home');
}]);