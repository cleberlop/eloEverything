var Category = require('../models/Category');
var User = require('../models/User');

module.exports = {
  checkAndAddNewCategories: function(req, res, next){
    var counter = 0;
    req.body.scores.forEach(function(score, index, arry){
      if(score === null){
        return false;
      }
      if (!score._id){
        counter++;
        var newCat = {name:score.category.toLowerCase()};
        Category.findOne(newCat, function(err, result){
          if(err){
            console.log(err);
            res.send(500);
          }
          console.log(result);
          if(result !== null){
            counter--;
            arry[index]._category = result._id;
            if (counter <1){
              next();
            }
          }else{
            Category.create(newCat, function(err, result){
              counter--;
              if(err){
                console.log(err);
              }else{
                //console.log(result);
                arry[index]._category = result._id;
                if (counter <1){
                  next();
                }
              }
            });
          }
        });
      }else{
        arry[index]._category = result._id;
      }
      if (counter<1){
        next();
    }});
  },
  getAllCategories: function(req, res){
    var queryObj= {};
    if (req.query.status === "All"){

    }else if (req.query.status){
      queryObj.fullCategory = true;
    }else{
      queryObj.fullCategory = true;
    }

    Category.find(queryObj, function(err, result){
      if(err){
        console.log(err);
        res.sendStatus(500);
      }
      res.json(result);
    });
  },
  getDifferentCategories: function(req, res){
    User.findById(req.user.id)
    .select('scores.category')
    .exec(function(err, result){
      User.find({})
      .where('_id').nin(result)
      .sort('-questions_count')
      .limit(10);
    });
  },
  updateCategory: function(req, res){
      Category.findByIdAndUpdate(req.body._id, req.body)
      .exec(function(err, result){
        if (err){
          console.log(err);
        }
        res.json(result);
      });
  }
};
