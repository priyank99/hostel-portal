var createError = require('http-errors');
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSession=require('express-session');
/*var studpassport=require('passport');
var adminpassport=require('passport');
var parpassport=require('passport');
var passportlocal=require('passport-local').Strategy;
var passportlocalmong=require('passport-local-mongoose');*/
var bodyParser = require('body-parser');
var flash=require('connect-flash');

var usersRouter = require('./routes/users');
var studentRouter = require('./routes/studentrouting');
var homeRouter = require('./routes/homepage');
var adminRouter = require('./routes/adminrouting');

var app = express();

mongoose.connect('mongodb://localhost/hos');

//Requiring the Models
var Student = require("./models/student.js");
var Parent =  require("./models/parent.js");
var Admin = require("./models/admin.js");

//seed();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended:true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(cookieParser());
app.use(expressSession({
  secret: "122 MB remaining, suffering a space constraint",
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(express.static(__dirname+"/public"));
/*app.use(passport.initialize());
app.use(passport.session());*/
//using passport
/*passport.use(new passportlocal(
function(username, password, done){
  Student.findOne({username:username}, function(err, user){
    if(err)
      {
        return done(err);
      }
    if(!user){
      return done(null, false, {message:'Incorrect Username'});
    }
    if(!user.validPassword(password))
      {
        return done(null, flase, {message:'Incorrect Password'});
      }
    return done(null, user);
  })
}));*/

/*passport.use('student', new passportlocal(Student.authenticate()));
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());*/

/*passport.use('admin', new passportlocal(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());*/

/*passport.use('parent', new passportlocal(Parent.authenticate()));
passport.serializeUser(Parent.serializeUser());
passport.deserializeUser(Parent.deserializeUser());*/
/*passport.use(new passportlocal(
function(username, password, done){
  Parent.findOne({username:username}, function(err, user){
    if(err)
      {
        return done(err);
      }
    if(!user){
      return done(null, false, {message:'Incorrect Username'});
    }
    if(!user.validPassword(password))
      {
        return done(null, flase, {message:'Incorrect Password'});
      }
    return done(null, user);
  })
}));*/

app.use('/student', studentRouter);
app.use('/admin', adminRouter);
app.get('/', function(req, res) {
  res.send('<a href="/student/login">Student</a><a href="/admin/login">Admin</a>');
});

/*app.use('/users', usersRouter);
app.use('/student', studentRouter);*/

// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  next(createError(404));
});*/

// error handler
/*app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});*/

function seed(){
  Student.remove({}, function(err){
    if(err){
      console.log(err);
    }
    console.log("DB Emptied");
  })
}
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.user=req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The NSIT HOSTEL Server Has Started!");
});

module.exports = app;
