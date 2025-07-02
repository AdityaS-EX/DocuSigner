const express = require('express');
const router = express.Router();
const { getAuditTrail } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');

// @route   GET /api/audit/:docId
// @desc    Get the audit trail for a document
// @access  Private (Owner only)
router.get('/:docId', protect, getAuditTrail);

// @route   DELETE /api/audit/:docId
// @desc    Mark the audit trail for a document for deletion
// @access  Private (Owner only)
const { clearAuditTrailForDocument } = require('../controllers/auditController');
router.delete('/:docId', protect, clearAuditTrailForDocument);

module.exports = router;
