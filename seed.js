/*
1. add hostel name
2. carddetails add list of free cards
3. to add student intially hostelname search and then link using objectid
4. find first free card and assign to student(findone)
5. to add history we have cid, timestamp and activity -> search sid and then add to history
6. hosteladmission in that search by rollno and then sid n get hid and set in it
*/
process.env.TZ = 'Asia/Calcutta';

const mongoose = require('mongoose');

const Student = require("./models/student.js");
const Hostel = require("./models/listofhostel.js");
const History = require("./models/history.js");
const HostelRecords = require("./models/hosteladmission.js");
const Parent =  require("./models/parent.js");
const Admin = require("./models/admin.js");
const Card = require("./models/carddetails.js");
const async = require('async');


console.log("Seed js");

var hostels = [
  {
    hostelname : "BH1"
  },
  {
    hostelname : "BH2"
  },
  {
    hostelname : "BH3"
  },
  {
    hostelname : "BH4"
  }
];

var cards = [
  {
    cid : "1",
  },
  {
    cid : "2",
  },
  {
    cid : "3",
  },
  {
    cid : "4",
  },
  {
    cid : "5",
  },
  {
    cid : "6",
  }
];

var students = [
  {
    password : "password123",
    rollNo : "25555",
    emailID : "test1@gmail.com",
    mobNo : "7685748",
    name: "test"
  },
  {
    password : "password123",
    rollNo : "25558",
    emailID : "test2@gmail.com",
    mobNo : "7685749",
    name: "test2"
  },
  {
    password : "password123",
    rollNo : "25578",
    emailID : "test3@gmail.com",
    mobNo : "7685778",
    name: "test3"
  },
  {
    password : "password123",
    rollNo : "25559",
    emailID : "test4@gmail.com",
    mobNo : "7685798",
    name: "test4"
  },
  {
    password : "password123",
    rollNo : "25557",
    emailID : "test5@gmail.com",
    mobNo : "7685746",
    name: "test5"
  }
];

var history = [
  {
    // cid: "5",
    activity : true
  },
  {
   // cid: "1",
    activity : false
  },
  {
     //cid: "1",
    activity : true
  },
  {
    // cid: "2",
    activity : false
  },
  {
    //cid: "3",
    activity : true
  }
];

var admins = [
  {
    adminname : "test",
    emailID : "test@gmail.com",
    accessLevel : 3,
    assignedTo : "BH3"
  },
  {
     adminname : "tes2",
     emailID : "test2@gmail.com",
     accessLevel : 2,
     assignedTo : "BH4"
  },
  {
     adminname : "test3",
     emailID : "tes3@gmail.com",
     accessLevel : 3,
     assignedTo : "BH3"
  },
  {
     adminname : "tes4",
     emailID : "test4@gmail.com",
     accessLevel : 1,
     assignedTo : "BH2"
  }
]


function seed(){

 //no1();
  //no2();
 //no3();
  //no4();

  //no5();
  //no5();
  //no5();
  //no5();
  //no5();
}

function no1(){
  console.log("1 called");
  hostels.forEach(function(hos){
  Hostel.create(hos, function(err, hostel){
    if(err){
      console.log(err);
      //return callback1(err);
    }
    else
      {
        console.log('created hostel ');
      }
  });
});
  //return callback1(null);
}

function no2(){
  console.log("2 called");
  //Function to add Cards
  cards.forEach(function(cd){
    Card.create(cd , function(err, card){
      if(err){
        console.log(err);
        //return callback2(err);
      }
      else
        {
          console.log('created card ');

        }
    });
  }
);

////return callback2(null);

}
var ih = 0;
function no3(){
  console.log("3 called");
  //Function to add student
 students.forEach(function(std){
 std.username = std.rollNo;
  Student.create(std, function(err, user){
    if(err){
      console.log(err);
      //return callback3(err);
    }
    else
      {
        var hostname = "BH3";
                 console.log("911");
               Hostel.findOne({hostelname: hostname}, function(err, hostel){
                 console.log("411");
                 if(err){
                   console.log(err);
                   //return callback3(err);
                 }
                 else{
                    console.log("211");
                   console.log(user);
                  user.hid = hostel._id;
                   console.log(user.hid);
                   Student.findByIdAndUpdate(user._id, user, function(err){
                     if(err){
                       console.log(err);
                     }
                     else{
                       history.forEach(function(hist){
                hist.sid = user._id;
                hist.hid = user.hid;
                hist.rollNo = user.rollNo;
                ih = ih + 1;
                console.log(hist.hid);
                console.log(user.hid);
                console.log("hist " + ih);
                History.create(hist, function(err, user){
                  if(err){
                    console.log(err);
                    //return callback3(err);
                  }
                  else{
                    console.log("history Created");
                  }
                });
              });
                       console.log("chal gya");
                     }
                   })
                 }
               });


              //Function to add history

      }
      }
  );

});
  //return callback3(null);
}

function no4(){
  console.log("4 called");
  admins.forEach(function(admin){
    admin.username = admin.emailID;
    admin.password = admin.adminname;
    Admin.create(admin, function(err, adm){
      if(err){
        console.log(err);
        //return callback4(err);
      }
      else{
        console.log("Admin Created");
      }
    })
  });
   //return callback4(null);
}

function no5(){
  console.log("5 called");
  Card.findOne({isassigned:false}, function(err, card){
    console.log("found findOne");
    if(err){
      console.log(err);
      //return callback5(err);
    }
    else{
      Student.findOne({cid : undefined}, function(err, std){
        if(err){
          console.log(err);
          //return callback5(err);
        }
        else{
          console.log(card);
          std.cid = card._id;
          card.sid = std._id;
          card.isassigned = true;
          card.cardStatus = 1;
          Student.findByIdAndUpdate(std._id, std, {new:true}, function(err, user){
            if(err){
              console.log(err);
              //return callback5(err);
            }
            else{
              Card.findByIdAndUpdate(card._id, card, {new:true}, function(err, cd){
                if(err){
                  console.log(err);
                  //return callback5(err);
                }
                else{
                  console.log(cd);
                  console.log("Student and Card Linked");
                  //return callback5(null);
                }
              })
            }
          })
        }
      })
    }
  });
}
module.exports = seed;
