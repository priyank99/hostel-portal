var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');

var studentschema = new mongoose.Schema({
  username : String,
  password : String,
  name : String,
  rollNo : String,
  dob : {
    type: Date,
    default : new Date(31104000000)
  },
  emailID : String,
  mobNo : String,
  roomNo : String,
  hid :  {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Hostel'
  },
  address : String,
  branch : String,
  section : String,
  localGuardName : String,
  localGuardAddr : String,
  localGuardMobNo : String,
  cid: {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Card'
  },
  parentCreate : {type:Boolean, default:false},
  resetPasswordToken : {
    type: String, default: undefined
  },
  resetPasswordExpires: { 
  type:String, default : undefined
  }
});

//Defining username and rollNo as unique elements
studentschema.index({
  username : 1,
  rollNo : 1,
  emailID : 1, 
  cardNo : 1,
}, {
  unique : true
});


studentschema.statics.authenticate = function(username, password, callback){
  Student.findOne({username : username}, function(err, user){
    if(err){
      return callback(err);
    }
    if(!user){
      err = new Error('Wrong Username or Password!');
      err.Status = 401;
      return callback(err);
    }
    //console.log(user);
    bcrypt.compare(password, user.password, function(err, result){
      if(err){
        return callback(err);
      }
      if(!result){
        err = new Error('Wrong Password!');
        //console.log(" bcrypt error");
        //console.log(err);
        err.Status=401;
        return callback(err);
      }
      if(result){
        return callback(null, user);
      }
    });
  });
}

studentschema.pre('save', function(next){
  var user =  this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if(err){
      return next(err);
    }
    user.password = hash;
    next();
  });
});

studentschema.methods.setPassword = function(password, next){
  var user = this;
  user.password = password;
  next();  
}

var Student = mongoose.model("Student", studentschema);
module.exports=Student;