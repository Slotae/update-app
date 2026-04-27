const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  userId: String,
  title: String,
  content: {
    type: String,
    default: ""
  },
  imageUrl: {
    type: String,
    default: ""
  },
  imagePath: {
    type: String,
    default: ""
  },
  pinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Note", NoteSchema);
