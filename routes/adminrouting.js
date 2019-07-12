var express = require('express');
var router = express.Router();
var async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
var Student = require('../models/student.js');
var Admin = require('../models/admin.js');
var Hostel = require("../models/listofhostel.js");
var History = require("../models/history.js");
var Card = require("../models/carddetails.js");

var fs = require('fs');
var csv = require('fast-csv');
var fileUpload = require('express-fileupload');
router.use(fileUpload());

var mongoose = require('mongoose');


//LOGIN PAGE
var data = {
  path: 'admin',
  name: 'Admin'
};

router.get('/login', function(req, res){
  res.render('login', {path:data});
 });

router.post('/login', function(req, res){
  Admin.authenticate(req.body.username, req.body.password, function(err, user){
    if(user){
      req.session.userdata = user;
      req.flash('success', "Successfully Logged In, Welcome " + req.session.userdata.adminname + '!');
      return res.redirect('/admin/home');
    }
    else{
      req.flash('error', err.message);
      res.redirect('/admin/login');
    }
    }
  );
});

//HOME PAGE
router.get('/home', isLoggedin,  function(req, res){
  Admin.findById(req.session.userdata._id, function(err, user){
    if(err){
      req.flash('error', err.message);
    }
    if(!user){
      req.flash('error', "User not Found! Please Login Again!");
      res.redirect('/admin/login');
    }
    if(user){
      res.render('admin/home', {user:user, access:user.accessLevel, name:user.adminname});
    }
  });
});


//Create new admins
router.get('/create', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>2){
    res.render('admin/addUser', {access:req.session.userdata.accessLevel,  name:req.session.userdata.adminname});
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/home');
  }
});

router.post('/create',  function(req, res){
  if(req.session.userdata.accessLevel>2){
     req.body.admin.password = req.body.admin.adminname;
     req.body.admin.username=req.body.admin.emailID;
     Admin.create(req.body.admin, function(err, user){
     if(err){
      req.flash('error', err.message);
      }
     else
      {
        res.redirect('/admin/users');
      }
      });
     }
  else
    {
      req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
      res.redirect('/admin/home');
    }
});

//All Users
/*router.get('/users', isLoggedin, function(req, res){
  Admin.find({}, function(err, user){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/home');
    }
    else
      {
        res.render('admin/allUsers', {user:user, name:req.session.userdata.adminname, access:req.session.userdata.accessLevel});
      }
  });
});*/

router.get('/addstudent', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>1){
    res.render('admin/addstudent', {access: req.session.userdata.accessLevel, name: req.session.userdata.adminname});
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/all');
  }
})

router.post('/addstudent', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>1){
    var student = req.body.student;
    student.password = "password123";
    student.username = student.rollNo;
    console.log(student);
    Student.create(student, function(err, std){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/student/all');
      }
      else{
        var hostname;
        switch(req.body.student.hostname){
          case '1': hostname="BH1"; break;
          case '2': hostname = "BH2"; break;
          case '3': hostname = "BH3"; break;
          case '4': hostname = "BH4"; break;
        }
        Hostel.findOne({hostelname: hostname}, function(err, hos){
          if(err){
            req.flash('error', err.message);
            res.redirect('/admin/student/all');
          }
          else{
            std.hid = hos._id;
            Card.findOne({isassigned: false, cardStatus: 4}, function(err, card){
              if(err){
                req.flash('error', err.message);
                res.redirect('/admin/student/all');
              }
              else{
                card.sid = std._id;
                std.cid = card._id;
                card.isassigned = true;
                card.cardStatus = 1;
                Student.findByIdAndUpdate(std._id, std, {new:true}, function(err, stud){
                  if(err){
                    req.flash('error', err.message);
                    res.redirect('/admin/student/all');
                  }
                  else{
                    console.log(stud);
                    console.log(card);
                    Card.findByIdAndUpdate(card._id, card, {new: true}, function(err, cd){
                      if(err){
                        req.flash('error', err.message);
                        res.redirect('/admin/student/all');
                      }
                      else{
                        console.log(cd);
                        req.flash('success', "Student has been Added Successfully!");
                        res.redirect('/admin/student/all');
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/all');
  }
})
/*
    CARD MANAGEMENT
*/
router.get('/allcards', isLoggedin, function(req, res)
{
  if(req.session.userdata.accessLevel>2){
    Card.find({}, function(err, cards){
      if(err){
        throw err;
      }
      else {
        console.log(cards);
          res.render('admin/allCard', {access: req.session.userdata.accessLevel, name: req.session.userdata.adminname, cards: cards});
      }
    })
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/');
  }
});

/*
Add Card csv
*/
router.get('/csvaddcard', isLoggedin, function(req, res)
{
  if(req.session.userdata.accessLevel>2){
    res.render('admin/csv_addcard', {access: req.session.userdata.accessLevel, name: req.session.userdata.adminname});
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/all');
  }
});

router.post('/csvaddcard', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>1){
    if(!req.files.file) {
        console.log("empty file");
        req.flash('error', "No file has been uploaded");
        return res.redirect('/admin/csvaddstudent');
    }
    var cardFile = req.files.file;
    console.log(cardFile);
    var cardarr = [];


    csv
        .fromString(cardFile.data.toString(), {
          headers: true,
          ignoreEmpty: false
        })
         .on("data", function(data){
           data['cardStatus'] = 4;
           data['isassigned'] = false;
           data['sid'] = null;

           cardarr.push(data);
         })
         .on("end", function() {
            console.log(cardarr);

              Card.create(cardarr, function(err, documents) {
                 if (err) throw err;
              });
             req.flash('success', cardarr.length + " Cards have been successfully added.");
             res.redirect('/admin/allcards');
         });
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/allcards');
  }
})

/*
    CSV student
*/
router.get('/csvaddstudent', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>1){
    res.render('admin/csv_addstudent', {access: req.session.userdata.accessLevel, name: req.session.userdata.adminname});
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/all');
  }
})

var assign_std_data = function(studentsarr, count){
  for(let i=0; i<studentsarr.length; i++){

    let data = studentsarr[i];
      Hostel.findOne({hostelname: data['hostname']}, function(err, hos) {
            if (err) {
                req.flash('error', err.message);
                res.redirect('/admin/student/all');
            }
            else {
                data['hid'] = hos._id;
                delete data.hostname;
            }// hostel else
        }).then( // hostel find
          function(){
            studentsarr[i] = data;
            console.log("After setting hostel id ");
            console.log(studentsarr[i] );
            count++;
          }
        )

  }
}

router.post('/csvaddstudent', isLoggedin, function(req, res){
  var ctr = 0;

    if(req.session.userdata.accessLevel > 1) {
        if(!req.files.file) {
            console.log("empty file");
            req.flash('error', "No file has been uploaded");
            return res.redirect('/admin/csvaddstudent');
        }

        var studFile = req.files.file;
        var studentsarr = [];
        console.log(studFile);
        csv
            .fromString(studFile.data.toString(), {
                headers: true,
                ignoreEmpty: false
            })
            .on("data", async function(data) {

                data['_id'] = new mongoose.Types.ObjectId();
                data['password'] = data['rollNo'] + data['branch'];
                data['username'] = data['rollNo'];
                console.log("loop");
                //console.log(data);
                //console.log(typeof data);
/*
                Hostel.findOne({hostelname: data['hostname']}, function(err, hos) {
                        if (err) {
                            req.flash('error', err.message);
                            res.redirect('/admin/student/all');
                        }
                        else {
                            data['hid'] = hos._id;
                            delete data.hostname;

                            console.log("After setting hostel id ");
                            console.log(data);
                        }// hostel else
                    }) // hostel find


                Card.findOne({cardStatus: 4, isassigned: false}, function(err, card) {
                    if (err) {
                        req.flash('error', err.message);
                        //res.redirect('/admin/student/all');
                    }
                    else if (!card) {
                        req.flash('error', "No cards available");
                        //res.redirect('/admin/student/all');
                    }
                    else {
                        //console.log("found 4 card");
                        //console.log(card);
                        card.sid = data['_id'];
                        data['cid'] = card._id;
                        console.log(data);

                        card.isassigned = true;
                        card.cardStatus = 1;

                        Card.findByIdAndUpdate(card._id, card, {new:true}, function(err, cd){
                              if(err){
                                throw err;
                              }
                              else {
                                console.log("updating card");
                                console.log(cd);
                                Student.create(data, function(err, std){
                                    if(err){
                                      throw err;
                                    }
                                    else {
                                      ctr++;
                                      console.log('student ' + ctr);
                                      console.log(std);
                                      studentsarr.push(data);
                                      console.log(studentsarr);
                                      ///next();
                                    }
                                })
                              }
                          }) // CardfindByIdAndUpdate
                    }

                }) // card find



                //console.log("after find ");
*/

                studentsarr.push(data);
                console.log('student ' + ctr++);
                //console.log(studentsarr);
          })  // on data
          .on("end", function() {
              console.log(" at end ");
              console.log(ctr);
              let count= 0;
              assign_std_data(studentsarr, count);
              then(
                function(){
                  console.log(studentsarr);
                }
              )

          });
    }
    res.redirect('/admin/home');
})




//Edit User Option
router.get('/:id/edituser', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>2){
    Admin.findById(req.params.id, function(err, user){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/users');
      }
      else{
       res.render('admin/edituser', {id: req.params.id, user:user, access:req.session.userdata.accessLevel,  name:req.session.userdata.adminname});
      }
    });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/home');
  }
});

router.put('/:id/edituser', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>2){
    Admin.findByIdAndUpdate(req.params.id, req.body.adm, {new:true}, function(err, user){
    if(err){
      req.flash('error', "Something went Wrong! "+err.message);
    }
    else{
      req.flash('success', "User data has been updated");
      res.redirect('/admin/users');
    }
   });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/users');
  }
});

//View History by Date
router.get('/historydate', isLoggedin, function(req, res){
  Hostel.find({}, function(err, hostels){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/home');
    }
    else{
      res.render('admin/datehistoryform', {name : req.session.userdata.adminname, hostels :  hostels, access:req.session.userdata.accessLevel});
    }
  });
});

router.post('/historydate', isLoggedin, function(req, res){
  var dd = new Date(req.body.date);
  var dd2 = new Date(req.body.date);
  dd2.setDate(dd2.getDate()+1);
  History.find({hid : req.body.hosid, datetime: {$gte:dd, $lt: dd2}}, function(err, hist){
    if(err){
      req.flash("error", err.message);
      res.redirect('/admin/home');
    }
    if(!hist){
       req.flash("error", "No Matching Records Found! " + err.message);
       res.redirect('/admin/home');
    }
    else{
      Student.find({hid: req.body.hosid}, function(err, students){
        if(err){
          req.flash("error", "No Matching Records Found! " + err.message);
          res.redirect('/admin/home');
        }
        else{
          res.render('admin/rangehistory', {name:req.session.userdata.adminname, students: students, history: hist, access:req.session.userdata.accessLevel});
        }
      });
    }
  });
});


//View History over a period for a hostel
router.get('/historyperiod', isLoggedin, function(req, res){
  Hostel.find({}, function(err, hostels){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/home');
    }
    else{
      res.render('admin/periodhistoryform', {name : req.session.userdata.adminname, hostels :  hostels, access:req.session.userdata.accessLevel});
    }
  });
});

router.post('/historyperiod', isLoggedin, function(req, res){
  var dd = new Date(req.body.startDate);
  var dd2 = new Date(req.body.endDate);
  History.find({hid : req.body.hosid, datetime: {$gte:dd, $lte: dd2}}, function(err, hist){
    if(err){
      req.flash("error", err.message);
      res.redirect('/admin/home');
    }
    if(!hist){
       req.flash("error", "No Matching Records Found! " + err.message);
       res.redirect('/admin/home');
    }
    else{
      Student.find({hid: req.body.hosid}, function(err, students){
        if(err){
          req.flash("error", "No Matching Records Found! " + err.message);
          res.redirect('/admin/home');
        }
        else{
          res.render('admin/rangehistory', {name:req.session.userdata.adminname, students: students, history: hist, access:req.session.userdata.accessLevel});
        }
      });
    }
  });
});

//Delete User
router.get('/:id/deluser', function(req, res){
  if(req.session.userdata.accessLevel>2){
    Admin.findById(req.params.id, function(err, user){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/users');
      }
      else{
       res.render('admin/deluser', {id: req.params.id, user:user, access:req.session.userdata.accessLevel});
      }
    });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/home');
  }
});

router.delete('/:id/deluser', function(req, res){
  if(req.session.userdata.accessLevel>2){
    Admin.findByIdAndRemove(req.params.id, function(err, user){
    if(err){
      req.flash('error', "Something went Wrong! "+err.message);
    }
    else{
      req.flash('success', "User has been removed!");
      res.redirect('/admin/users');
    }
   });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/users');
  }
});


//Logout Option
router.get('/logout', isLoggedin, function(req, res){
  if(req.session.userdata){
   delete req.session.userdata;
   req.flash('success', "Successfully Logged Out!");
   res.redirect('/admin/login');
  }
  }
);

/*
_______________________________________________________________________________________________________________
STUDENT SECTION
*/

//All Students
router.get('/student/all', isLoggedin, function(req, res){
  Student.find({}, function(err, user){
    if(err){
       req.flash('error', err.message);
       res.redirect('/admin/student/all');
    }
    else
      {
        Card.find({}, function(err, cards){
          if(err){
            req.flash('error', err.message);
            res.redirect('/admin/student/all');
          }
          else{
            //console.log(cards);
            //console.log(user);
            res.render('admin/allStudent', {user:user, name:req.session.userdata.adminname, access:req.session.userdata.accessLevel, card : cards});
          }
        });
      }
  });
});

//Home for Student Section
router.get('/student/home', isLoggedin, function(req, res){
  Student.findById(req.session.student, function(err, user){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/student/all');
    }
    else{
     Card.findById(user.cid, function(err, card){
       if(err){
         req.flash('error', err.message);
         res.redirect('/admin/student/all');
       }
       else{
        res.render('admin/home_student', {user : user, access:req.session.userdata.accessLevel, card: card});
       }
     });
    }
  });
});

router.post('/student/home', isLoggedin, function(req, res){
  Student.findOne({rollNo: req.body.rno}, function(err, user){
    if(err){
       req.flash('error', err.message);
       res.redirect('/admin/student/all');
    }
    else{
      req.session.student = user._id;
      res.redirect('/admin/student/home');
    }
  });
});

//View Specific Student History
router.get('/student/history', isLoggedin, function(req, res, next){
  History.find({sid : req.session.student}, function(err, history){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/student/home');
    }
    else{
      res.render('admin/history_admin', {history : history, access:req.session.userdata.accessLevel});
    }
  })
});

//Edit Specific Student Profile
router.get('/student/edit', isLoggedin, function(req, res, next){
  if(req.session.userdata.accessLevel>1){
     Student.findById(req.session.student, function(err, user){
       if(err){
         req.flash('error', err.message);
         res.redirect('/admin/student/home');
       }
       else{
        Card.findById(user.cid, function(err, card){
       if(err){
         req.flash('error', err.message);
         res.redirect('/admin/student/all');
        }
       else{
        res.render('admin/edit_profile', {user : user, access:req.session.userdata.accessLevel, card: card});
        }
       });
       }
     });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for Modifying Student Data!");
    res.redirect('/admin/student/home');
  }
});

router.put('/student/edit', isLoggedin, function(req, res, next){
  if(req.session.userdata.accessLevel>1){
    Student.findByIdAndUpdate(req.session.student, req.body.std, {new:true}, function(err, user){
    if(err){
      req.flash('error', "Something went Wrong! "+err.message);
    }
    else{
      res.redirect('/admin/student/viewprofile');
    }
   });
  }
  else{
    req.flash('error', "Unauthorized Access! You do not have permission for adding Users");
    res.redirect('/admin/student/home');
  }
});

//View Profile
router.get('/student/viewprofile', isLoggedin, function(req, res, next){
  Student.findById(req.session.student, function(err, user){
    if(err){
      req.flash('error', err.message);
      res.redirect('/admin/student/home');
    }
    else{
      Card.findById(user.cid, function(err, card){
        if(err){
          req.flash('error', err.message);
          res.redirect('/admin/student/home');
        }
        else{
          res.render('admin/profile', {user : user, access:req.session.userdata.accessLevel, card: card});
        }
      });
    }
  });
});

//Block card
router.get('/student/blockcard', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel>2){
    Student.findById(req.session.student, function(err, std){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/student/viewprofile');
      }
      else{
        Card.findById(std.cid, function(err, card){
          if(err){
            req.flash('error', err.message);
            res.redirect('/admin/student/home');
          }
          else{
            res.render('admin/blockcard', {user : std, access:req.session.userdata.accessLevel, card: card});
          }
      });
    }
  });
  }

  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/viewprofile');
  }

});

router.post('/student/blockcard', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel > 2){
    Student.findById(req.session.student, function(err, std){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/student/home');
      }
      else{
        var cid = std.cid;
        Card.findById(cid, function(err, card){
              if(err){
                req.flash('error', err.message);
                res.redirect('/admin/student/home');
              }
              else{
                card.isassigned = false;
                card.cardStatus = 3;
                //card.sid = undefined;
                Card.findByIdAndUpdate(card._id, card, {new: true}, function(err, cd){
                  if(err){
                    req.flash('error', err.message);
                    res.redirect('/admin/student/home');
                  }
                  else{
                    console.log(cd);
                    req.flash('success', "Card has been Blocked!");
                    res.redirect('/admin/student/home');
                  }
                })
              }
            })
        }
      })
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/viewprofile');
  }
});


//Unblock Card
router.post('/student/unblockcard', isLoggedin, function(req, res){
  if(req.session.userdata.accessLevel > 2){
    Student.findById(req.session.student, function(err, std){
      if(err){
        req.flash('error', err.message);
        res.redirect('/admin/student/home');
      }
      else{
        Card.findById(std.cid, function(err, card){
          if(err){
            req.flash('error', err.message);
            res.redirect('/admin/student/home');
          }
          else{
            card.isassigned = true;
            card.cardStatus = 1;
            Card.findByIdAndUpdate(card._id, card, {new: true}, function(err, cd){
              if(err){
                req.flash('error', err.message);
                res.redirect('/admin/student/home');
              }
              else{
                req.flash('success', "Card has been Unblocked!");
                res.redirect('/admin/student/home');
              }

            })
          }
        })
      }
    })
  }
  else{
    req.flash('error', "You are Unauthorized to access this service");
    res.redirect('/admin/student/viewprofile');
  }
})


//isLoggedin function
function isLoggedin(req, res, next){
  if(req.session && req.session.userdata){
    Admin.findById(req.session.userdata._id, function(err, user){
      if(err){
        err= new Error('Please Login to Continue');
        err.Status=401;
        req.flash('error', err.message);
        res.redirect('/'+data.path+'/login');
      }
      else
        {
          next();
        }
    });
  }
  else
    {
      var err= new Error('Please Login to Continue');
      err.Status=401;
      req.flash('error', err.message);
      res.redirect('/'+data.path+'/login');
    }
}


//-----------------------------------------------------------------------------------------------------
// forgot & reset password
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
      Admin.findOne({ emailID : req.body.email }, function(err, user) {
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
  Admin.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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
      Admin.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
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
