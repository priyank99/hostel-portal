var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var adminschema = new mongoose.Schema({
  username : String,
  password : String,
  adminname : String,
  dob : Date,
  emailID : String,
  mobNo : String,
  address : String,
  accessLevel : { type: Number, min:1, max:3, default: 1},
  assignedTo : String, //Hostel Name
  resetPasswordToken :  {type : String, default :undefined },
  resetPasswordExpires : {type : String, default : undefined}
});

adminschema.index({
  username : 1
}, {
  unique : true
});

adminschema.statics.authenticate = function(username, password, callback){
  Admin.findOne({username : username}, function(err, user){
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

adminschema.pre('save', function(next){
  var user =  this;
  bcrypt.hash(user.password, 10, function(err, hash){
    if(err){
      return next(err);
    }
    user.password = hash;
    next();
  });
});

adminschema.methods.setPassword = function(password, next){
  var user = this;
  user.password = password;
  next();  
}


var Admin = mongoose.model("Admin", adminschema);

module.exports=Admin;


