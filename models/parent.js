var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');

var parentschema = new mongoose.Schema({
  username : String,
  sid : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Student'
  },
  name : String,
  dob: Date,
  password : String,
  mobNo : String,
  address : String,
  emailID : String,
  resetPasswordToken : {
    type: String, default: undefined
  },
  resetPasswordExpires: { 
  type:String, default : undefined
  }
});

//Defining username and rollNo as unique elements
parentschema.index({
  username : 1
}, {
  unique : true
});

parentschema.statics.authenticate = function(username, password, callback){
  Parent.findOne({username : username}, function(err, user){
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

parentschema.pre('save', function(next){
  var user =  this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if(err){
      return next(err);
    }
    user.password = hash;
    next();
  });
});

parentschema.methods.setPassword = function(password, next){
  var user = this;
  user.password = password;
  next();  
}

var Parent=mongoose.model("Parent", parentschema);

module.exports=Parent;