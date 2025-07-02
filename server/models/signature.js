const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Not required for public invitees
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  page: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    default: 'Signature Here',
  },
  font: {
    type: String,
    default: 'Arial',
  },
  fontSize: {
    type: Number,
    default: 24, // Default font size
  },
  color: {
    type: String,
    default: '#000000', // Default to black
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending',
    required: true,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Signature', signatureSchema);