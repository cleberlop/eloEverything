var Question = require('../models/Question');
var flow = require('../flow.js')
var shuffle = require('knuth-shuffle').knuthShuffle;
var _ = require('underscore');
var User = require('../models/User');
var Category = require('../models/Category');
var async = require('async');

var k = 15;
var defaultPlayerScore = 1200;
var questionRange = 200;

function calculateUserChangeInRating(score, user, question){
  var scoreChange = [];
  //console.log("Starting Scoring");
  //console.log(user.scores);
  //console.log(question);

  for(var i=0;i<question.scores.length;i++){
    //console.log(question);
    //console.log(question.scores);
    //console.log(question.scores[i]);//WTH clearly I am doing something bizzare o.O
    //console.log(question.scores[i]._doc._category._doc._id.toString());
    var category = question.scores[i]._doc._category._doc._id.toString();



    //console.log('categoryId',category);
   // console.log(user.scores);
    var userScoreIndex = -1;
    //console.log('userScoreIndex',userScoreIndex);
    for (var j=0;j<user.scores.length;j++){

      if(category === user.scores[j]._doc._category.toString()){
        userScoreIndex = j;
        j = user.scores.length;
      }
    }

    var userRating;
    var userRatingId;
    var questionRating = question.scores[i].score;

    if (userScoreIndex>-1){
      userRating  = user.scores[userScoreIndex].score;
    }else{
      //TODO find better place to put the defualt player rating.
      userRating = 1200;
    }
    var ratingChange = calculateRatingChange(score,userRating,questionRating,question.possible_answers.length+1);
    question.scores[i].score -= ratingChange;
    //console.log('userRatingId',userRatingId);
    if (userScoreIndex ==-1){
      user.scores.push({
        _category:category,
        score:userRating+=ratingChange,
        answered:1
      })
    }else{
      user.scores[userScoreIndex].score +=ratingChange;
      user.scores[userScoreIndex].answered +=1;
    }
    scoreChange.push({
      category:question.scores[i]._category.name,
      deltaScore:ratingChange
    });
  }
  question.save(function(err){
    if(err){
      console.log(err);
    }else{
      //console.log("success?");
    }
  });
  user.save(function(err){
    if(err){
      console.log(err);
    }else{
      //console.log("success?");
    }
  });
  return scoreChange;
}

function calculateRatingChange(score, userRating, questionRating, n){
  var p = 1 / (1 + Math.pow(10,(questionRating-userRating)/400));
  var Ep = p + (1-p)/n;
  var dRp = k*(score- Ep);

  return dRp;
}

function increaseCategoryQuestionCount(scores){
  //console.log("Counting question", scores)
  scores.forEach(function(item){
    Category.findById(item._category, function (err, result){
      if(err){
        console.log(err)
        return false;
      }
      //console.log(result.questions_count);
      result.questions_count+=1;
      result.save();
    })
  })
}

module.exports = {
  seeQuestions:function (req, res){
      Question.find()
      .populate('scores._category', "name")

      //.select('scores question')
      .populate('_creator', "display_name _id")
      .exec(function(err, result){
        if(err){
          console.log(err);
          res.sendStatus(500);
        }else{
          async.forEach(result.scores, function(score, callback){
            Category.populate(score, {path:"category"}, function(err,output){
              if (err){
                console.log(err)
                throw err;
              }
              callback();
            });
          },function(err){
            //console.log(result);
            res.json(result);
          }
        )
        }
    });
  },
  askQuestion:function(req, res){
    //console.log(req.params.recent_questions);
    Question.count()
    .where('_id').nin(req.params.recent_questions)
    .elemMatch('scores',{
      _category:req.params.category,
      score:{$gt:req.params.score-questionRange, $lt:req.params.score*1+questionRange}
    })
    .exec(function(err, result){
      if (err){
        console.log(err);
        res.sendStatus(500);
      }else{
        //console.log("Valid Questions:",result);
        if (result==0) {
          res.json([]);
          return 0;
        }
        Question.findOne()
        .where('_id').nin(req.params.recent_questions)
        .elemMatch('scores',{
          _category:req.params.category,
          score:{$gt:req.params.score-questionRange, $lt:req.params.score*1+questionRange}
        })
        .skip(Math.floor(Math.random()*result))
        .exec(function(err, result){
          if(err){
            console.log(err)
          }else{
            //console.log("------------------------------------------");
            //console.log(req.params.recent_questions);
            //console.log(result._id);
            //console.log("------------------------------------------");

            result.possible_answers.push(result.correct_answer);
            shuffle(result.possible_answers);
            result.correct_answer = "";

            res.json(result);
          }
        })
      }
    });
  },
  addQuestion:function(req, res){
      //console.log("Adding Question");
      //console.log(req.user);
      //console.log(req.session.passport);
      req.body._creator = req.user._id;
      //console.log(req.body);
      Question.create(req.body, function(err, result){
        if(err){
          console.log(err);
          res.sendStatus(500);
        }else{
          increaseCategoryQuestionCount(req.body.scores);
          res.json(result);
        }
    });
  },
  answerQuestion:function(req,res){
    //console.log("answering Question");
    Question.findById(req.params.questionId)
    .populate('scores._category', 'name')
    .exec(function(err, question){
      //console.log(question)
      if(err){
        console.log(err);
        res.sendStatus(500);
      }else{
        //Retrieved
        var score;
        if (req.body.answer === question.correct_answer){
          score = 1;
        }else if(req.body.pass){
          score = 1/(question.possible_answers.length+1);
        }else{
          score = 0;
        }
        //console.log("score:",score);
        User.findById(req.user._id, function(err, user){
          if(err){
            console.log(err);
            res.sendStatus(500);
          }else{
            //console.log("question:", question);
            //console.log("user:", user);
            var deltaScores = calculateUserChangeInRating(score, user, question);
            deltaScores.answer = question.correct_answer;
            res.json({correct_answer:question.correct_answer,deltaScores:deltaScores});
          }
        });
      }
    })
  },
  updateQuestion:function(req, res){
    console.log("Updating Question", req.params.questionId);
    console.log(req.body);
    Question.findByIdAndUpdate(req.params.questionId, req.body, {new:true})
    .exec(function(err, result){
      if(err){console.log(err); res.sendStatus(500)}
      else{
        console.log(result);
        res.send(result)
      }
    })
  },
  mathHistogram:function(req, res){
    console.log("Hit Math Histogram Endpoint");
    console.log(req.body);
    Question.
    res.send("I Was Here");
  }

}
