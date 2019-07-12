process.env.TZ = 'Asia/Calcutta';
process.env.GMAILID = 'nshostesting@gmail.com';
process.env.GMAILPW = '**********';

var createError = require('http-errors');
var express = require('express');
var mongoose = require('mongoose');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressSession=require('express-session');
var bodyParser = require('body-parser');
var flash=require('connect-flash');
var methodOverride = require('method-override');
var flash = require('connect-flash');
const ejsLint = require('ejs-lint');

var usersRouter = require('./routes/users');
var studentRouter = require('./routes/studentrouting');
var homeRouter = require('./routes/homepage');
var adminRouter = require('./routes/adminrouting');
var parentRouter = require('./routes/parentrouting');

var app = express();
var seed2  = require('./seed.js');

mongoose.connect('mongodb://localhost/hos2',function(){
    /* drop the db if exists*/
/*
    mongoose.connection.db.dropDatabase();
    console.log("db dropped")
*/
    //seed2();

});

//Requiring the Models
var Student = require("./models/student.js");
var Hostel = require("./models/listofhostel.js");
var History = require("./models/history.js");
var HostelRecords = require("./models/hosteladmission.js");
var Parent =  require("./models/parent.js");
var Admin = require("./models/admin.js");
var Card = require("./models/carddetails.js");



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended:true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
//app.use(cookieParser());
app.use(flash());
app.use(expressSession({
  cookie:{
    path : '/',
    maxAge : 1*60*60*1000,
    httpOnly : false
  },
  secret: "122 MB remaining, suffering a space constraint",
  resave: true,
  saveUninitialized: false
}));
app.use(express.static(__dirname+"/public"));

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.user=req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.use('/student', studentRouter);
app.use('/admin', adminRouter);
app.use('/parent', parentRouter);
app.get('/', function(req, res) {
  res.render('landing3');
});


app.listen(process.env.PORT, process.env.IP, function(){
   console.log("The NSIT HOSTEL Server Has Started!");
});

module.exports = app;
