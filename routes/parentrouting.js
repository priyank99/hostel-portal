var express = require('express');
var router = express.Router();
var Student = require('../models/student.js');
const session = require('express-session');
var Parent = require('../models/parent.js');
var History = require("../models/history.js");
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

//LOGIN PAGE

var data = {
  path: 'parent',
  name: 'Parent'
};

router.get('/login', function(req, res) {
  res.render('login', {
    path: data
  });
})

router.post('/login', function(req, res) {
  Parent.authenticate(req.body.username, req.body.password, function(err, user) {
    if (user) {
      req.session.userdata = user;
      req.flash('success', "Successfully Logged In, Welcome " + req.session.userdata.name + '!');
      return res.redirect('/parent/home');
    } else {
      req.flash('error', err.message);
      res.redirect('/parent/login');
    }
  });
});

//Home Option
router.get('/home', isLoggedin, function(req, res) {
  Parent.findById(req.session.userdata._id, function(err, user) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/parent/login');
    }
    if (!user) {
      req.flash("error", "User not Found! Please Login Again to Continue");
      res.redirect('/parent/login');
    }
    if (user) {
      res.render('parent/home', {
        parentname : user.name,
        parent: user
      });
    }
  });
});

/*//View Profile
router.get('/viewprofile', isLoggedin, function(req, res) {
  Student.findById(req.session.userdata._id, function(err, user) {
    if (err) {
      req.flash('error', "Something Went Wrong!" + err.message);
      res.redirect('/student/home');
    }
    if (!user) {
      req.flash("error", "User not Found! Please Login Again to Continue");
      res.redirect('/student/login');
    }
    if (user) {
      res.render('student/std_profile', {
        student: user, parentcreate : user.parentCreate
      });
    }
  });
});*/

//View History
router.get('/studenthistory', isLoggedin, function(req, res, next) {
   History.find({sid: req.session.userdata.sid}, function(err, hist){
     if(err){
       req.flash('error',  err.message);
       res.redirect('/parent/home');
     }
     else{
       res.render('parent/history', { history : hist, parentname:req.session.userdata.name });
     }
   });
});

//Logout Option
router.get('/logout', isLoggedin, function(req, res, next) {
  if (req.session.userdata) {
    delete req.session.userdata;
    req.flash('success', "Successfully Logged Out!");
    res.redirect('/parent/login');
  }
});

//isLoggedin function
function isLoggedin(req, res, next) {
  if (req.session && req.session.userdata) {
    Parent.findById(req.session.userdata._id, function(err, user) {
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
      Parent.findOne({ emailID : req.body.email }, function(err, user) {
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
  Parent.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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
      Parent.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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