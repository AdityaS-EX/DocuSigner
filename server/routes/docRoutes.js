const express = require('express');
const router = express.Router();
const { uploadDocument, getUserDocuments, deleteDocument } = require('../controllers/docController'); // Added deleteDocument
const { protect } = require('../middleware/auth'); // JWT authentication middleware

// @route   POST /api/docs/upload
// @desc    Upload a PDF document
// @access  Private (Requires JWT authentication)
router.post('/upload', protect, uploadDocument);

// @route   GET /api/docs
// @desc    Get all documents for the authenticated user
// @access  Private (Requires JWT authentication)
router.get('/', protect, getUserDocuments);

// @route   DELETE /api/docs/:id
// @desc    Delete a document by its ID
// @access  Private (Requires JWT authentication)
router.delete('/:id', protect, deleteDocument);

const { uploadSignedDocument } = require('../controllers/docController');
router.post('/upload-signed/:documentId', protect, uploadSignedDocument);

module.exports = router;
