var mongoose = require("mongoose");


var hostelschema = new mongoose.Schema(
{
  hostelname : String
});

hostelschema.index({
  hostelname : 1
}, {
  unique : true
});

var Hostel = mongoose.model("Hostel", hostelschema);

module.exports = Hostel;