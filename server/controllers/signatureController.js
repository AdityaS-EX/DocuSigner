const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const Signature = require('../models/signature');
const Document = require('../models/document');

// @desc    Create a new signature
// @route   POST /api/signatures
// @access  Private
exports.createSignature = async (req, res) => {
    const { documentId, x, y, page, text, font, color, fontSize } = req.body;
  const userId = req.user.id; // Assuming protect middleware adds user to req

  // Basic validation
  if (documentId == null || x == null || y == null || page == null) {
    return res.status(400).json({ message: 'Missing required fields: documentId, x, y, page.' });
  }

  if (typeof x !== 'number' || typeof y !== 'number' || typeof page !== 'number') {
    return res.status(400).json({ message: 'Coordinates (x, y) and page must be numbers.' });
  }

  if (page < 1) {
    return res.status(400).json({ message: 'Page number must be 1 or greater.' });
  }

  try {
    // Check if the document exists
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Optional: Check if the user is authorized to add a signature to this document
    // (e.g., if the document belongs to them or they have permission)
    // For now, we assume if they are authenticated, they can add to any document they have an ID for.

    const newSignature = new Signature({
        documentId,
        userId,
        x,
        y,
        page,
        text: text || 'Signature Here',
        font: font || 'Arial',
        color: color || '#000000',
        fontSize: fontSize || 24,
    });

    const savedSignature = await newSignature.save();

    res.status(201).json({
      message: 'Signature position saved successfully.',
      signature: savedSignature,
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error while saving signature.' });
  }
};

// @desc    Get all signatures for a specific document
// @route   GET /api/signatures/:documentId
// @access  Private (assuming only authenticated users can see signatures)
exports.getSignaturesForDocument = async (req, res) => {
  const { documentId } = req.params;
  const userId = req.user.id; // from protect middleware

  if (!documentId) {
    return res.status(400).json({ message: 'Document ID is required.' });
  }

  try {
    // First, verify the document exists and the user has rights to view it (optional, depends on app logic)
    // For this example, we assume if the user is authenticated, they can attempt to fetch signatures.
    // A more robust check might involve ensuring the document belongs to the user or their organization.
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Optional: Add a check here to ensure the req.user has permission to view this document's signatures.
    // For instance, if the document has a 'user' field:
    // if (document.user.toString() !== userId) {
    //   return res.status(403).json({ message: 'User not authorized to view signatures for this document.' });
    // }

    const signatures = await Signature.find({ documentId }).populate('userId', 'name email'); // Populate user details

    res.status(200).json(signatures); // Send back an array (could be empty)

  } catch (error) {
    console.error('Error fetching signatures for document:', error);
    if (error.name === 'CastError') { // Invalid ObjectId format for documentId
        return res.status(400).json({ message: 'Invalid Document ID format.' });
    }
    res.status(500).json({ message: 'Server error while fetching signatures.' });
  }
};

// @desc    Delete a signature
// @route   DELETE /api/signatures/:signatureId
// @access  Private
exports.deleteSignature = async (req, res) => {
const { signatureId } = req.params;
  const userId = req.user.id;
  const mongoose = require('mongoose');

  if (!signatureId) {
    return res.status(400).json({ message: 'Signature ID is required.' });
  }

  try {
    // Atomically find a signature that matches the ID AND belongs to the user, then delete it.
    // Explicitly cast to ObjectId to prevent any potential type mismatches.
    const signature = await Signature.findOneAndDelete({ 
      _id: new mongoose.Types.ObjectId(signatureId), 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!signature) {
      // If no document was found and deleted, it means either it didn't exist
      // or it didn't belong to the user. In either case, it's a "Not Found" for this user.
      return res.status(404).json({ message: 'Signature not found or user not authorized.' });
    }

    res.status(200).json({ message: 'Signature deleted successfully.' });

  } catch (error) {
    console.error('Error deleting signature:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid Signature ID format.' });
    }
    res.status(500).json({ message: 'Server error while deleting signature.' });
  }
};

// @desc    Update a signature's position, text, or font
// @route   PUT /api/signatures/:signatureId
// @access  Private
exports.updateSignature = async (req, res) => {
  const { signatureId } = req.params;
  const { x, y, text, font, color, fontSize } = req.body; // Add fontSize
  const userId = req.user.id;

  // No specific fields are required, user can update any combination
  
  try {
    const signature = await Signature.findById(signatureId);

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found.' });
    }

    if (signature.userId.toString() !== userId) {
      return res.status(403).json({ message: 'User not authorized to update this signature.' });
    }

    // Update fields only if they are provided in the request body
    if (x != null) signature.x = x;
    if (y != null) signature.y = y;
    if (text != null) signature.text = text;
    if (font != null) signature.font = font;
    if (color != null) signature.color = color;
    if (fontSize != null) signature.fontSize = fontSize; // Add fontSize update

    const updatedSignature = await signature.save();
    
    res.status(200).json({
      message: 'Signature updated successfully.',
      signature: updatedSignature,
    });

  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({ message: 'Server error while updating signature.' });
  }
};
