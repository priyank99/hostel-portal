var mongoose = require('mongoose');


var cardschema = new mongoose.Schema({
  cid : { type: String, unique : true},
  isassigned : {
    type: Boolean,
    default : false
  },
  cardStatus : {type: Number, min: 0, max: 4, default: 4},
  sid : {
    type:mongoose.Schema.Types.ObjectId,
    ref : 'Student'
  }
});
/*
cardschema.index({
  cid : 1,
  sid : 1,
}, {
  unique :true
})
*/
var Card = mongoose.model('Card', cardschema);


module.exports = Card;
