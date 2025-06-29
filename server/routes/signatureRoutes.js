const express = require('express');
const router = express.Router();
const { createSignature, getSignaturesForDocument, deleteSignature, updateSignature } = require('../controllers/signatureController');
const { protect } = require('../middleware/auth'); // Assuming your JWT middleware is here

// POST /api/signatures - Save signature coordinates
router.post('/', protect, createSignature);

// GET /api/signatures/:documentId - Get all signatures for a specific document
router.get('/:documentId', protect, getSignaturesForDocument);

// DELETE /api/signatures/:signatureId - Delete a signature
router.delete('/:signatureId', protect, deleteSignature);

// PUT /api/signatures/:signatureId - Update a signature's position
router.put('/:signatureId', protect, updateSignature);

module.exports = router;