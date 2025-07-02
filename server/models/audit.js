const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
    enum: ['uploaded', 'signed', 'viewed', 'downloaded', 'shared', 'signature_updated', 'signature_deleted', 'document_deleted'],
  },
  ip: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  markedForDeletionAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('Audit', auditSchema);
