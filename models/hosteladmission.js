var mongoose = require('mongoose');

var hosteladmschema = new mongoose.Schema({
  hid : {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'Hostel'
  },
  sid : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Student'
  },
  dateofAdm : Date,
  dateofExit : Date
});

var HostelRecords = mongoose.model('HostelRecord', hosteladmschema);

module.exports = HostelRecords