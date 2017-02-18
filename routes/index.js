
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');

var passport = require('passport');

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment= mongoose.model('Comment');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


router.get('/',function(reqq,res,next){
  res.render('index.ejs');
})


//////////////////////////////////////////registration and login///////////////////////////////////

router.post('/register',function(req,res,next){
  console.log("wwweeeeeeeeeeeeeeeeeeeee" +req.body.username +  req.body.password);
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  var user = new User();
  user.username = req.body.username;

  user.setPassword(req.body.password);
  user.save(function (err){
    if(err){ 
      console.log(err);
      console.log("fuck this shi");
      return next(err); 
    }
    return res.json({token: user.generateJwt()})
  });
});

router.post('/login', function(req, res, next){
  console.log("HHHHHHHHHHHHHHEEEEEEEEEEEEEE");
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJwt()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});



//////////////////////////////////////routing for the posts///////////////////////////////////////

/* Getting all the posts*/
router.get('/posts', function(req, res, next) {
  Post.find(function(err,posts){
    if(err){
      return next(err);
    }
    res.json(posts);
  });
});

/* save a post */ 
router.post('/posts',auth,function(req,res,next){
  var post = new Post(req.body);
  post.author = req.payload.username;
  post.save(function(err,post){
    if(err){
      return next(err);
    }
    res.json(post);
  });
});


/* upvote a post */
router.put('/posts/:post/upvote',auth,function(req,res,next){
  req.post.upvotes++;
  req.post.save(function(err){
    if(err){
      return next(err);
    }
    res.json(req.post);
  })
  
});


//returning a single post
router.get('/posts/:post',function(req,res){
  //console.log("Now this : ",req.post);
  req.post.populate('comments',function(err,post){
    if(err){
      return next(err);
    }
    res.json(req.post);
  });
  
})




/* called everytime there is parameter attached to find a ppost*/
router.param('post',function(req,res,next,id){
  var query = Post.findById(id);
  //console.log(query + ' thi is it');
  query.exec(function(err,post){
    if(err){
      return next(err);
    }
    if(!post){
      return next(new Error('can\'t find post'));
    }
    
    req.post = post;
    //console.log('First ',req.post);
    return next();
  });
});

router.param('comment',function(req,res,next,id){
  //console.log("wahhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh kirk.??????????" + id + Comment.findById(id));
  var query = Comment.findById(id);
  //console.log(query+ "FUCK THIS LIFE");
  query.exec(function(err,comment){
    if(err){
      return next(err);
    }
    if(!comment){
      return next(new Error('Can not find comment')); 
    }
    
    req.comment = comment;
    return next();
  });
});


router.put('/posts/:post/comments/:comment/upvote',auth,function(req,res,next){
  console.log("uuuuuuuuuuuuuuuppppppppppppppvooooooooooote");
  req.comment.upvote(function(err,post){
    if(err){
      return next(err);
    }
    res.json(req.comment);
  })
});

router.get('/posts/:post/comments/:comment',function(req,res,next){
  res.json(req.comments);
});

/*posting the comment according to the post */
router.post('/posts/:post/comments',auth,function(req,res,next){
  var comment = new Comment(req.body);
  console.log("req.body: " + req.body + " req.post : " + req.post); 
  comment.post= req.post;
  comment.author = req.payload.username;
  comment.save(function(err,comment){
    if(err){
      return next(err);
    }
    req.post.comments.push(comment); // just because comment is an array 
    req.post.save(function(err,post){
      if(err){
        return next(err);
      }
      post.populate('comments',function(err,newPost){
        if(err){
          return next(err);
        }
        console.log(newPost.comments.length);
        res.json(newPost.comments[newPost.comments.length-1]);
      });
      
    });
  });
});



module.exports = router;
