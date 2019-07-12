var mongoose = require('mongoose');


var histschema = new mongoose.Schema({
  hid : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  },
  sid : {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'Student'
  },
  rollNo : String,
  datetime : {
    type: Date,
    default : Date.now()
  },
  activity : Boolean
});


var History = mongoose.model('History', histschema);

module.exports = History;