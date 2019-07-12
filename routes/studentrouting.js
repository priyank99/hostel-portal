var express = require('express');
var router = express.Router();
var Student = require('../models/student.js');
const session = require('express-session');
var Parent = require('../models/parent.js');
var History = require("../models/history.js");
var Card = require("../models/carddetails.js");
var async = require('async');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var nodemailer = require('nodemailer');

//LOGIN PAGE

var data = {
  path: 'student',
  name: 'Student'
};

router.get('/login', function(req, res) {
  res.render('login', {
    path: data
  });
})

router.post('/login', function(req, res) {
  Student.authenticate(req.body.username, req.body.password, function(err, user) {
    if (user) {
      req.session.userdata = user;
      req.flash('success', "Successfully Logged In, Welcome " + req.session.userdata.name + '!');
      return res.redirect('/student/home');
    } else {
      err = new Error('Wrong Username or Password!'); //use connect-flash for flashing
      err.Status = 401;
      req.flash('error', err.message);
      res.redirect('/student/login');
    }
  });
});

//Home Option
router.get('/home', isLoggedin, function(req, res) {
  Student.findById(req.session.userdata._id, function(err, user) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/student/login');
    }
    if (!user) {
      req.flash("error", "User not Found! Please Login Again to Continue");
      res.redirect('/student/login');
    }
    if (user) {
      Card.findOne({sid: req.session.userdata._id}, function(err, card){
        if(err){
          req.flash('error', err.message);
          res.redirect('/student/logout');
        }
        else{
          res.render('student/home', { student: user, parentcreate : user.parentCreate, card: card });
        }
      });
    }
  });
});

//View Profile
router.get('/viewprofile', isLoggedin, function(req, res) {
  Student.findById(req.session.userdata._id, function(err, user) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/student/home');
    }
    if (!user) {
      req.flash("error", "User not Found! Please Login Again to Continue");
      res.redirect('/student/login');
    }
    if (user) {
      Card.findOne({sid: req.session.userdata._id}, function(err, card){
        if(err){
          req.flash('error', err.message);
          res.redirect('/student/home');
        }
        else{
             res.render('student/std_profile', { student: user, parentcreate : user.parentCreate, card: card });
        }
      });
    }
  });
});

//View History
router.get('/history', isLoggedin, function(req, res, next) {
   History.find({sid: req.session.userdata._id}, function(err, hist){
     if(err){
       req.flash('error', "Something went Wrong! "+ err.message);
       res.redirect('/student/home');
     }
     else{
       res.render('student/history', { history : hist, parentcreate : req.session.userdata.parentCreate, student:{
         username : req.session.userdata.username, rollNo : req.session.userdata.rollNo
       }});
     }
   });
});

//Add Parent Information
router.get('/addparent', isLoggedin, function(req, res){
  res.render('student/addparent', {parentcreate : req.session.userdata.parentCreate});
});

router.post('/addparent', isLoggedin, function(req, res){
  req.body.parent.sid = req.session.userdata._id;
  req.session.userdata.parentCreate = true;
  req.body.parent.username = req.body.parent.emailID;
  req.body.parent.password = req.body.parent.name;
  Parent.create(req.body.parent, function(err, user){
    if(err){
      req.flash('error', err.message);
      res.redirect('/student/home');
    }
    else{
      Student.findByIdAndUpdate(req.session.userdata._id, req.session.userdata, {new:true}, function(err, user){
        if(err){
          req.flash('error', err.message);
          res.redirect('/student/home');
        }
        else{
          req.session.userdata = user;
          req.flash('success', "Parent Information has been Added!");
          res.redirect('/student/parentinfo');
        }
      });
    }
  });
});


//View Parent Info
router.get('/parentinfo', isLoggedin, function(req, res){
  Parent.findOne({sid:req.session.userdata._id}, function(err, user){
    if(err){
      req.flash('error', err.message);
      res.redirect('/student/home');
    }
    res.render('student/parent', {parentcreate : req.session.userdata.parentCreate, parent : user});
  });
});


//Lost Card Option
router.get('/blockcard', isLoggedin, function(req, res){
  res.render('student/blockcard', {parentcreate : req.session.userdata.parentCreate});
});

router.post('/blockcard', isLoggedin, function(req, res){
    console.log(req.body.pwd);
    console.log(req.session.userdata);
    bcrypt.compare(req.body.pwd, req.session.userdata.password, function(err, result){
      if(err){
        req.flash('error', err.message);
        res.redirect('/student/home');
      }
      if(!result){
       req.flash('error', 'Wrong Password! Re-Enter Password');
       res.redirect('/student/blockcard');
      }
      if(result){
        //blockcard();
        Card.findById(req.session.userdata.cid, function(err, card){
          if(err){
            req.flash('error', err.message);
            res.redirect('/student/home');
          }
          else{
            card.cardStatus = 2;
            card.isassigned = false;
            Card.findByIdAndUpdate(card._id, card, {new:true}, function(err, cd){
              if(err){
                req.flash('error', err.message);
                res.redirect('/student/home');
              }
              else{
                console.log(cd);
                req.flash('success', 'Card Successfully Blocked!');
                res.redirect('/student/home');
              }
            })
          }
        })
      //  res.redirect('/student/home');
      }
    });
})

//Logout Option
router.get('/logout', isLoggedin, function(req, res, next) {
  if (req.session.userdata) {
    delete req.session.userdata;
    req.flash('success', "Successfully Logged Out!");
    res.redirect('/student/login');
  }
});

//Create new students
router.post('/create', function(req, res, next) {
  var newstd = new Student(req.body);
  Student.create(newstd, function(err, user) {
    if (err) {
      console.log(err);
      return next(err);
    }
    console.log("created");
  })
});

//isLoggedin function
function isLoggedin(req, res, next) {
  if (req.session && req.session.userdata) {
    Student.findById(req.session.userdata._id, function(err, user) {
      if (err) {
        err = new Error('Please Login to Continue');
        err.Status = 401;
        req.flash('error', err.message);
        res.redirect('/' + data.path + '/login');
      } else {
        next();
      }
    });
  } else {
    var err = new Error('Please Login to Continue');
    err.Status = 401;
    req.flash('error', err.message);
    res.redirect('/' + data.path + '/login');
  }
}

//-----------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------


// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot', {path:data});
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Student.findOne({ emailID : req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          //console.log(req.session);
          return res.redirect('/'+ data.path + '/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILID,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.emailID,
        from: process.env.GMAILID,
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'https://' + req.headers.host + '/' + data.path + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.emailID + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/' + data.path + '/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  Student.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/' + data.path + '/forgot');
    }
    res.render('reset', {token: req.params.token, path:data});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      Student.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function(err){
              req.session.userdata = user;
              done(err, user);
            });

          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user:  process.env.GMAILID,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.emailID,
        from: process.env.GMAILID,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.emailID + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/' + data.path + '/login');
  });
});

module.exports = router;
