const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const Signature = require('../models/signature');
const Document = require('../models/document');
const Audit = require('../models/audit');
const util = require('util');
const jwt = require('jsonwebtoken');

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
    
    // --- AUDIT LOG ---
    await Audit.create({
      documentId,
      userId,
      action: 'signed',
      ip: req.ip,
    });
    // --- END AUDIT LOG ---

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
    const signature = await Signature.findOne({ _id: signatureId });
    if (!signature) {
      return res.status(404).json({ message: 'Signature not found.' });
    }
    if (signature.userId.toString() !== userId) {
      return res.status(403).json({ message: 'User not authorized to delete this signature.' });
    }
    
    await signature.deleteOne();

    // --- AUDIT LOG ---
    await Audit.create({
      documentId: signature.documentId,
      userId: req.user.id,
      action: 'signature_deleted',
      ip: req.ip,
    });
    // --- END AUDIT LOG ---

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
  const { x, y, text, font, color, fontSize, status, rejectionReason } = req.body; // Add status and rejectionReason
  const userId = req.user.id;
  
  try {
    const signature = await Signature.findById(signatureId).populate('documentId');

    if (!signature) {
      return res.status(404).json({ message: 'Signature not found.' });
    }

    const isDocumentOwner = signature.documentId.user.toString() === userId;
    const isSignatureOwner = signature.userId ? signature.userId.toString() === userId : false;

    // --- Authorization Logic ---
    // An action is permitted if the user is the document owner OR the signature creator.
    if (!isDocumentOwner && !isSignatureOwner) {
        return res.status(403).json({ message: 'You are not authorized to modify this signature.' });
    }
    
    // A non-document-owner cannot change the status (accept/reject).
    // This check is now more specific: it only triggers if the status is actually being changed.
    if (!isDocumentOwner && status && signature.status !== status) {
        return res.status(403).json({ message: 'Only the document owner can change the signature status.' });
    }

    // Update fields only if they are provided in the request body
    if (x != null) signature.x = x;
    if (y != null) signature.y = y;
    if (text != null) signature.text = text;
    if (font != null) signature.font = font;
    if (color != null) signature.color = color;
    if (fontSize != null) signature.fontSize = fontSize; // Add fontSize update
    if (status) {
        signature.status = status;
        // If the status is being changed to 'pending' or 'signed', clear the rejection reason.
        if (status === 'pending' || status === 'signed') {
            signature.rejectionReason = '';
        }
    }
    if (rejectionReason) signature.rejectionReason = rejectionReason;


    const updatedSignature = await signature.save();
    
    // --- AUDIT LOG ---
    await Audit.create({
      documentId: signature.documentId._id,
      userId: req.user.id,
      action: 'signature_updated',
      ip: req.ip,
    });
    // --- END AUDIT LOG ---

    res.status(200).json({
      message: 'Signature updated successfully.',
      signature: updatedSignature,
    });

  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({ message: 'Server error while updating signature.' });
  }
};

exports.addPublicSignature = async (req, res) => {
    const { shareToken, x, y, page, text, font, color, fontSize } = req.body;

    if (!shareToken) {
        return res.status(401).json({ message: 'A share token is required.' });
    }
    
    try {
        // 1. Verify the share token to get the document ID
        const decoded = await util.promisify(jwt.verify)(shareToken, process.env.JWT_SECRET);
        const document = await Document.findOne({
            _id: decoded.docId,
            shareToken: shareToken,
            shareTokenExpires: { $gt: Date.now() },
        });

        if (!document) {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }

        // 2. Create the new signature, but without a userId
        const newSignature = new Signature({
            documentId: document._id,
            // No userId for public signatures
            x,
            y,
            page,
            text: text || 'Signature',
            font: font || 'Helvetica',
            color: color || '#000000',
            fontSize: fontSize || 24,
        });

        const savedSignature = await newSignature.save();
        
        // --- AUDIT LOG ---
        await Audit.create({
          documentId: document._id,
          action: 'signed', // Public user signed
          ip: req.ip,
          // userId is omitted for public users
        });
        // --- END AUDIT LOG ---

        res.status(201).json({
            message: 'Signature added successfully.',
            signature: savedSignature,
        });
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }
        console.error('Error saving public signature:', error);
        res.status(500).json({ message: 'Server error while saving signature.' });
    }
};

exports.updatePublicSignature = async (req, res) => {
    const { signatureId } = req.params;
    const { shareToken, ...updateData } = req.body;

    if (!shareToken) {
        return res.status(401).json({ message: 'A share token is required.' });
    }

    try {
        // 1. Verify the share token to get the document ID
        const decoded = await util.promisify(jwt.verify)(shareToken, process.env.JWT_SECRET);
        const document = await Document.findOne({ 
            _id: decoded.docId, 
            shareToken: shareToken,
            shareTokenExpires: { $gt: Date.now() },
        });

        if (!document) {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }

        // 2. Find the signature and ensure it belongs to the correct document
        const signature = await Signature.findById(signatureId);
        if (!signature || signature.documentId.toString() !== document._id.toString()) {
            return res.status(404).json({ message: 'Signature not found or does not belong to this document.' });
        }

        // Public users can only update signatures that DON'T have a userId
        if (signature.userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this signature.' });
        }
        
        // 3. Apply updates and save
        Object.assign(signature, updateData);
        const updatedSignature = await signature.save();

        res.status(200).json({
            message: 'Signature updated successfully.',
            signature: updatedSignature,
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }
        console.error('Error updating public signature:', error);
        res.status(500).json({ message: 'Server error while updating signature.' });
    }
};

exports.deletePublicSignature = async (req, res) => {
    const { signatureId } = req.params;
    // The shareToken must be passed in the request body for DELETE requests
    const { shareToken } = req.body;

    if (!shareToken) {
        return res.status(401).json({ message: 'A share token is required.' });
    }

    try {
        // 1. Verify the share token
        const decoded = await util.promisify(jwt.verify)(shareToken, process.env.JWT_SECRET);
        const document = await Document.findOne({ 
            _id: decoded.docId,
            shareToken: shareToken,
        });

        if (!document) {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }

        // 2. Find the signature and verify it belongs to the document and is a public signature
        const signature = await Signature.findOne({
            _id: signatureId,
            documentId: document._id,
        });

        if (!signature) {
            return res.status(404).json({ message: 'Signature not found for this document.' });
        }

        // 3. CRITICAL CHECK: Ensure a public user cannot delete a signature made by the owner.
        if (signature.userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this signature.' });
        }

        // 4. Delete the signature
        await signature.deleteOne();

        res.status(200).json({ message: 'Signature deleted successfully.' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired share token.' });
        }
        console.error('Error deleting public signature:', error);
        res.status(500).json({ message: 'Server error while deleting signature.' });
    }
};
