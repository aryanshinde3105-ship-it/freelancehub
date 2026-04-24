const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    clientMessageId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

messageSchema.index(
  { projectId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Message', messageSchema);
