
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const util = require('util');
const sendEmail = require('../utils/email');
const Document = require('../models/document');
const Signature = require('../models/signature');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Note: The 'uploadsDir' variable is not needed here anymore as it's handled in the middleware.

const Audit = require('../models/audit');
// @desc    Upload a PDF document
// @route   POST /api/docs/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Manually construct the correct "raw" file URL
        const correctUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${req.file.filename}`;

        const newDocument = new Document({
            filename: req.file.originalname,
            path: correctUrl, // Use the correctly constructed URL
            user: req.user.id,
            cloudinaryPublicId: req.file.filename
        });

        const savedDocument = await newDocument.save();
        
        // --- AUDIT LOG ---
        await Audit.create({
          documentId: savedDocument._id,
          userId: req.user.id,
          action: 'uploaded',
          ip: req.ip,
        });
        // --- END AUDIT LOG ---

        res.status(201).json({
            message: 'File uploaded to Cloudinary and metadata saved successfully!',
            document: savedDocument,
        });
    } catch (dbError) {
        console.error('Error saving document metadata to DB:', dbError);
        // If DB save fails, we should ideally delete the uploaded file from Cloudinary
        if (req.file) {
            // This requires cloudinary object to be available here
            // cloudinary.uploader.destroy(req.file.filename); 
            console.error('An orphaned file may exist in Cloudinary:', req.file.filename);
        }
        res.status(500).json({ message: 'Error saving document metadata. Please try again.' });
    }
};



// @desc    Get all documents for the authenticated user
// @route   GET /api/docs
// @access  Private
exports.getUserDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(documents);
    } catch (error) {
        console.error('Error fetching user documents:', error);
        res.status(500).json({ message: 'Server error while fetching documents.' });
    }
};

const User = require('../models/user'); // Make sure User model is available

// @desc    Share a document with another registered user
// @route   POST /api/docs/:id/share
// @access  Private
exports.shareDocument = async (req, res, next) => {
    try {
        const { email } = req.body;
        const docId = req.params.id;

        if (!email) {
            return res.status(400).json({ message: 'Recipient email is required.' });
        }

        const [doc, userToShareWith] = await Promise.all([
            Document.findById(docId),
            User.findOne({ email: email })
        ]);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to share this document.' });
        }
        if (!userToShareWith) {
            return res.status(404).json({ message: `User with email ${email} not found. Please ask them to register first.` });
        }
        if (userToShareWith._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'You cannot share a document with yourself.' });
        }
        if (doc.sharedWith.includes(userToShareWith._id)) {
            return res.status(400).json({ message: `This document is already shared with ${email}.` });
        }

        doc.sharedWith.push(userToShareWith._id);
        await doc.save();

        // Send a notification email instead of a magic link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const message = `The document "${doc.filename}" has been shared with you by ${req.user.name}. Please log in to your DocuSigner account to view and sign it under the "Shared With Me" section.\n\n${frontendUrl}/login`;

        await sendEmail({
            email: userToShareWith.email,
            subject: `A document has been shared with you: ${doc.filename}`,
            message,
        });
        
        // Pass to audit middleware
        req.auditDetails = {
            sharedWithUserId: userToShareWith._id
        };
        next();

    } catch (error) {
        console.error('Error sharing document:', error);
        res.status(500).json({ message: 'An internal server error occurred during the sharing process.' });
    }
};

// This entire function is now deprecated by the new "shared" workflow.
// I am leaving it here, commented out, for reference, but it should not be used.
// exports.getSigningDocument = async (req, res) => { ... };



// @desc    Delete a document by its ID
// @route   DELETE /api/docs/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized.' });
        }

        // Delete the file from Cloudinary, specifying 'raw' for non-image files like PDFs
        if (doc.cloudinaryPublicId) {
            const { cloudinary } = require('../utils/cloudinary');
            await cloudinary.uploader.destroy(doc.cloudinaryPublicId, { resource_type: 'raw' });
        } else {
            // Fallback for older documents that might not have a public ID
            console.log(`Document ${doc._id} in DB but might not be on Cloudinary or lacks a public ID.`);
        }
        
        // --- AUDIT LOG ---
        await Audit.create({
          documentId: doc._id,
          userId: req.user.id,
          action: 'document_deleted',
          ip: req.ip,
        });
        // --- END AUDIT LOG ---

        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Document and associated files deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error while deleting the document.' });
    }
};

const fetch = require('node-fetch');

exports.downloadSignedDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        const signatures = await Signature.find({ documentId: doc._id, status: 'signed' });

        // Fetch the PDF from Cloudinary URL
        const pdfUrl = doc.path;
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
        }
        const existingPdfBytes = await response.arrayBuffer();
        
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();

        for (const sig of signatures) {
            if (sig.page > pages.length) continue;
            const page = pages[sig.page - 1];
            
            let font;
            try {
                font = await pdfDoc.embedFont(sig.font || StandardFonts.Helvetica);
            } catch (e) {
                font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            }
            
            const color = sig.color ? hexToRgb(sig.color) : { r: 0, g: 0, b: 0 };

            page.drawText(sig.text, {
                x: sig.x,
                y: page.getHeight() - sig.y,
                font: font,
                size: sig.fontSize,
                color: rgb(color.r/255, color.g/255, color.b/255),
            });
        }

        const signedPdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=signed-${doc.filename}`);
        res.send(Buffer.from(signedPdfBytes));

    } catch (error) {
        console.error('Error generating signed PDF for download:', error);
        res.status(500).json({ message: 'Failed to generate signed PDF.' });
    }
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// @desc    Get details for a single document
// @route   GET /api/docs/details/:id
// @access  Private
exports.getDocumentDetails = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        // Ensure the user owns the document
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to view this document.' });
        }
        
        res.status(200).json(doc);
    } catch (error) {
        console.error('Error fetching document details:', error);
        res.status(500).json({ message: 'Server error while fetching document details.' });
    }
};

// @desc    Get all documents shared with the authenticated user
// @route   GET /api/docs/shared
// @access  Private
exports.getSharedDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ sharedWith: req.user.id })
            .populate('user', 'name email') // Populate owner's info
            .sort({ createdAt: -1 });
            
        res.status(200).json(documents);
    } catch (error) {
        console.error('Error fetching shared documents:', error);
        res.status(500).json({ message: 'Server error while fetching shared documents.' });
    }
};
