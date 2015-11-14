var app = angular.module("eloEverything", ['ngRoute',"angucomplete","agGrid"]);

app.constant('AUTH_EVENTS',{
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
});

app.constant('USER_ROLES', {
  all: '*',
  admin: 'admin',
  moderator: 'moderator',
  user: 'user'
});

app.config(function($routeProvider){
  $routeProvider.when("/quiz",{
    templateUrl:"app/js/quiz/quiz_template.html",
    controller:"quizController",
    resolve:{
      categories:function(categoriesService){
        return categoriesService.getAllCategories();
      },
      user: function(usersService, $route, $location){
        return usersService.getMe().then(function(result){
          if(result._id){
          return result;
        }else{
          $location.path("/login");
        }
      });
      }
    }
  }).when("/users",{
    templateUrl:"app/js/users/users_list_template.html",
    controller:'usersController',
    resolve:{
      users:function(usersService){
        return usersService.getAllUsers();
      }
    }
  }).when("/newQuestion",{
    templateUrl:"app/js/newQuestion/new_question_template.html",
    controller:"newQuestionController",
    resolve:{
      categories:function(categoriesService){
        return categoriesService.getAllCategories();
      }
    }
  })
  .when("/profile",{
    templateUrl:"app/js/profile/profile_template.html",
    controller:"profileController",
    resolve:{
      user: function(usersService, $route, $location){
        return usersService.getMe().then(function(result){
          if(result._id){
          return result;
        }else{
          $location.path("/login");
        }
      });
      }
    }
  })
  .when("/login", {
      templateUrl:"app/js/login/login_template.html",
      controller:"loginController"
  }).when("/admin", {
    templateUrl:"app/js/admin/admin_template.html",
    controller:"adminController"
  }).when("/admin/questions",{
    templateUrl:"app/js/admin/questions/questions_template.html",
    controller:"adminQuestionsController",
    resolve:{
      questions:function(questionsService, $location){
        return questionsService.getAllQuestions()
        .then(function(res){return res;},
              function(err){$location.path('/login');});
      },
      categories:function(categoriesService){
        return categoriesService.getAllCategories();
      }
    }
  }).when('/admin/users', {
    templateUrl:"app/js/admin/users/users_template.html",
    controller:"adminUsersController",
    resolve:{
      users:function(usersService, $location){
          return usersService.getUsersAdmin()
          .then(function(res){return res;},
                function(err){$location.path('/login');});
      }
    }
  }).when("/admin/complaints",{
    templateUrl:"app/js/admin/complaints/complaints_template.html",
    controller:"adminComplaintsController",
    resolve:{
      complaints:function(complaintsService,$location){
        return complaintsService.getComplaints()
        .then(function (res){return res;},
              function(err){$location.path('/login');});
      }
    }
  }).when("/admin/categories",{
    templateUrl:"app/js/admin/categories/categories_template.html",
    controller:"adminCategoriesController",
    resolve:{
      categories:function(categoriesService,$location){
        return categoriesService.getAllCategories('All')
        .then(function (res){return res;},
              function(err){$location.path('/login');});
      }
    }
  }).otherwise({
    redirectTo:"/quiz/"
  });
});
