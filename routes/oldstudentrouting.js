var express = require('express');
var router = express.Router();
var Student = require('../models/student.js');
var passport = require('passport');
var passportlocal = require('passport-local');
  /*passport.use('student', new passportlocal(Student.authenticate()));
  passport.serializeUser(Student.serializeUser());
  passport.deserializeUser(Student.deserializeUser());*/



/* GET login page. */
var loginData = {
  path : "student",
  name: "Student"
}
router.get('/login', function(req, res) {
 
  res.render('login', {path: loginData});
});

router.post('/login', passport.authenticate('student', {
  successRedirect : '/student/home',
  failureRedirect: '/student/login',
  failureFlash: true,
  successFlash: true
}));


//Home Option
router.get('/home', isLoggedin,  function(req, res, next){
  Student.findById(req.user._id, function(err, user){
    if(err){
      console.log(err);
      return next(err);
    }
    if(!user){
      req.flash("error", "User not Found");
    }
    if(user){
      res.render('student/home', {student:user});
    }
  })
})

//View Profile
router.get('/viewprofile', isLoggedin,  function(req, res, next){
  Student.findById(req.user._id, function(err, user){
    if(err){
      console.log(err);
      return next(err);
    }
    if(!user){
      req.flash("error", "User not Found");
    }
    if(user){
      res.render('student/std_profile', {student:user});
    }
  })
})

//Logout Option
router.get('/logout', function(req, res){
  req.logout();
  req.flash("success", "Successfully Logged Out");
  res.redirect('/student/login');
});

function isLoggedin(req, res, next){
  if(req.isAuthenticated())
    {
      return next();
    }
  else
    {
      req.flash("error", 'You must be signed in');
      res.redirect('/student/login');
    }
}

//View History
router.get('/history',isLoggedin, function(req, res, next) {
  Student.findById(req.user._id, function(err, user){
    if(err){
      console.log("Error Occured");
      return next(err);
    }
    else
      {
        res.render('student/history', {student:user});
      }
  })
});
/*
_________________________________________________________________________________________
*/

//Create new students
router.post('/create', function(req, res){
  var obj= {
    datetime: new Date(),
    activity: true
  };
  var newstd=new Student({username:req.body.username, rollNo:"2564"});
  newstd.history.push(obj);
  console.log(newstd);
  Student.register(newstd, req.body.password, function(err, res){
    if(err)
      {
        console.log(err);
        return res.render('login');
      }
    console.log("created");
  })
});

/*router.post('/history/create', function(req, res){
  Student.findById()
})*/    //For Card Reader File (will work once card reader file is created)



/*
GET history table data
*/
var tableData = [
    {
      date : "2018-08-06",
      time: "16:35",
      activity: "IN"
    },
    {
     date : "2018-08-06",
      time: "09:42",
      activity: "OUT"
    }];




//Edit Profile
router.get('/edit',isLoggedin, function(req, res, next) {
  //console.log(req.user);
  Student.findById(req.user._id, function(error, user) {
    if(error){
      console.log("edit error");
      return next(error);
    }
    else{
      console.log(user);
      res.render('student/edit_profile', {student: user});
    }
  })
});

module.exports = router;
