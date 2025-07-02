const express = require('express');
const router = express.Router();
const { 
    createSignature, 
    getSignaturesForDocument, 
    deleteSignature, 
    updateSignature, 
    addPublicSignature, 
    updatePublicSignature,
    deletePublicSignature 
} = require('../controllers/signatureController');
const { protect } = require('../middleware/auth'); // Assuming your JWT middleware is here

// POST /api/signatures/public - Save a signature from a public user
router.post('/public', addPublicSignature);

// PUT /api/signatures/public/:signatureId - Update a signature from a public user
router.put('/public/:signatureId', updatePublicSignature);

// DELETE /api/signatures/public/:signatureId - Delete a signature from a public user
router.delete('/public/:signatureId', deletePublicSignature);

// POST /api/signatures - Save signature coordinates
router.post('/', protect, createSignature);

// GET /api/signatures/:documentId - Get all signatures for a specific document
router.get('/:documentId', protect, getSignaturesForDocument);

// DELETE /api/signatures/:signatureId - Delete a signature
router.delete('/:signatureId', protect, deleteSignature);

// PUT /api/signatures/:signatureId - Update a signature's position
router.put('/:signatureId', protect, updateSignature);

module.exports = router;