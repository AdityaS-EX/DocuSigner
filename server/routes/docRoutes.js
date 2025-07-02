const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const auditLog = require('../middleware/audit');

// --- Specific Routes First ---

// @route   POST /api/docs/upload
// @desc    Upload a PDF document to Cloudinary
// @access  Private
router.post('/upload', protect, upload.single('documentFile'), docController.uploadDocument);

// @route   GET /api/docs/shared
// @desc    Get all documents shared with me
// @access  Private
router.get('/shared', protect, docController.getSharedDocuments);

// @route   GET /api/docs
// @desc    Get all documents I own
// @access  Private
router.get('/', protect, docController.getUserDocuments);

// DEPRECATED: The public signing route is replaced by the "shared" workflow
// router.get('/sign/:token', docController.getSigningDocument);

// --- Parameterized Routes Last ---

// @route   POST /api/docs/:id/share
// @desc    Share a document with a registered user
// @access  Private
router.post('/:id/share', protect, docController.shareDocument, auditLog('shared'));

// @route   GET /api/docs/:id/download
// @desc    Download the finalized PDF with all signatures
// @access  Public
router.get('/:id/download', auditLog('downloaded'), docController.downloadSignedDocument);

// @route   DELETE /api/docs/:id
// @desc    Delete a document by its ID
// @access  Private
router.delete('/:id', protect, docController.deleteDocument);

// @route   GET /api/docs/details/:id
// @desc    Get details for a single document
// @access  Private
router.get('/details/:id', protect, docController.getDocumentDetails);


module.exports = router;
