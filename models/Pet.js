const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hunger: { type: Number, default: 50 },       
  happiness: { type: Number, default: 50 },    
  cleanliness: { type: Number, default: 50 },  
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Pet', PetSchema);