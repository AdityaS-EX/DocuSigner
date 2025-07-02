const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const { protect } = require('../middleware/auth');
const { uploadOriginal, uploadSigned } = require('../middleware/multerUpload');

// --- Specific Routes First ---

// @route   POST /api/docs/upload
// @desc    Upload a PDF document
// @access  Private
router.post('/upload', protect, uploadOriginal, docController.uploadDocument);

// @route   GET /api/docs
// @desc    Get all documents for the authenticated user
// @access  Private
router.get('/', protect, docController.getUserDocuments);

// @route   GET /api/docs/sign/:token
// @desc    Access a document for signing with a token
// @access  Public
router.get('/sign/:token', docController.getSigningDocument);



// --- Parameterized Routes Last ---

// @route   POST /api/docs/:id/share
// @desc    Share a document for signing via email
// @access  Private
router.post('/:id/share', protect, docController.shareDocument);

// @route   GET /api/docs/:id/download
// @desc    Download the finalized PDF with all signatures
// @access  Public
router.get('/:id/download', docController.downloadSignedDocument);

// @route   DELETE /api/docs/:id
// @desc    Delete a document by its ID
// @access  Private
router.delete('/:id', protect, docController.deleteDocument);


module.exports = router;
