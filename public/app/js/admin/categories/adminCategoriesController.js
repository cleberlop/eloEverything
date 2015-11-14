var app = angular.module("eloEverything");

app.controller("adminCategoriesController", function($scope, categories, categoriesService){
  $scope.categories = categories;
  var columnDefs = [
    {headerName: "Title", field:"name"},
    {headerName: "Category", field:"fullCategory", cellRenderer:checkmark},
    {headerName: "Questions", field:"questions_count"}
  ];

  $scope.gridOptions = {
      columnDefs:columnDefs,
      rowData:categories
  };

  function checkmark(params){
    var elem = document.createElement("span");
    if (params.value){
      elem.className = "glyphicon glyphicon-ok";
    }else{
      elem.className = "glyphicon glyphicon-remove";
    }
    elem.addEventListener('dblclick', function(e){
      console.log(e);
      console.log(params);
      params.data.fullCategory = !params.data.fullCategory;
    });
    return elem;
  }
});
