var express = require('express');
var router = express.Router();
var Student = require('../models/student.js');
var Admin = require('../models/admin.js');
var passport = require('passport');
var passportlocal=require('passport-local');

/*passport.use('admin', new passportlocal(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());*/

//Login for Admin
var loginData = {
  path : "admin",
  name: "Admin"
};
  
router.get('/login', function(req, res) {
  res.render('login', {path: loginData});
});

/*router.post('/login', passport.authenticate('admin', {
  successRedirect : '/admin/home',
  failureRedirect: '/admin/login',
  failureFlash: true,
  successFlash: true
}));*/

router.post('/login', function(req, res, next){
  passport.authenticate('admin', function(err, user, info){
    if(err){
      console.log(err);
      return next(err);
    }
    if(!user){
      console.log(user);
      return next(err);
    }
    req.logIn(user, function(err){
      if(err){
        console.log(err);
        return next(err);
      }
      console.log(user);
      console.log(info);
      console.log(err);
      console.log("USER LOGGED IN");
      res.redirect('/admin/home');
    })
  })(req, res, next);
});

//Create new admins
router.get('/create', function(req, res){
  res.render('admin/addUser');
});

router.post('/create',  function(req, res){
  console.log(req.body);
  var pwd=req.body.admin.adminname+req.body.admin.address;
  req.body.admin.username=req.body.admin.emailID;
  Admin.register(req.body.admin,pwd, function(err, user){
    if(err){
      console.log(err);
      req.flash('error', err.message);
    }
    else
      {
        console.log(user);
        console.log('created');
        res.redirect('/admin/users');
      }
  });
});

/*// search students by roll no
router.post('/searchbyroll', isLoggedin,  function(req, res){
  Student.findOne(({rollNo: req.body.rollNo}, function(err, user) {
        if(err)
      {
        console.log(err);
        return res.render('notfound');
      }
    return res.render('view_student_profile', {user : user});
  }))
});*/

//View all Users
router.get('/users', function(req, res){
  console.log(req.user);
});

function isLoggedin(req, res, next){
  if(req.isAuthenticated())
    {
      return next();
    }
  else
    {
      req.flash("error", 'You must be signed in');
      res.redirect('/admin/login');
    }
}

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/admin/login');
});

//Home Option
router.get('/home',  function(req, res, next){
  console.log(req);
  Admin.findById(req.user._id, function(err, user){
    if(err){
      console.log(err);
      return next(err);
    }
    if(!user){
      req.flash("error", "User not Found");
    }
    if(user){
      res.render('admin/home', {user:user});
    }
  })
})

module.exports=router;