
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const util = require('util');
const sendEmail = require('../utils/email');
const Document = require('../models/document');
const Signature = require('../models/signature');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Note: The 'uploadsDir' variable is not needed here anymore as it's handled in the middleware.

// @desc    Upload a PDF document
// @route   POST /api/docs/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        const newDocument = new Document({
            filename: req.file.filename,
            path: path.join('uploads', req.file.filename),
            user: req.user.id,
        });
        const savedDocument = await newDocument.save();
        res.status(201).json({
            message: 'File uploaded and metadata saved successfully!',
            document: savedDocument,
        });
    } catch (dbError) {
        console.error('Error saving document metadata to DB:', dbError);
        fs.unlink(req.file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting orphaned file:', unlinkErr);
        });
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

// @desc    Share a document for signing via email
// @route   POST /api/docs/:id/share
// @access  Private
exports.shareDocument = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Recipient email is required.' });
        }
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to share this document.' });
        }
        const token = jwt.sign({ docId: doc._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        doc.shareToken = token;
        doc.shareTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await doc.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const signUrl = `${frontendUrl}/sign/${token}`;
        const message = `You have been invited to sign a document. Please use the following link, which is valid for 24 hours:\n\n${signUrl}`;

        await sendEmail({
            email: email,
            subject: `Invitation to sign: ${doc.filename}`,
            message,
        });

        res.status(200).json({ message: `An invitation to sign has been sent to ${email}.` });
    } catch (error) {
        console.error('Error sharing document:', error);
        if (error.message.includes('Email could not be sent')) {
            return res.status(502).json({ message: 'The email service failed. Please try again later.' });
        }
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

// @desc    Access a document for signing with a token
// @route   GET /api/docs/sign/:token
// @access  Public
exports.getSigningDocument = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const doc = await Document.findOne({
            _id: decoded.docId,
            shareToken: token,
            shareTokenExpires: { $gt: Date.now() },
        });
        if (!doc) {
            return res.status(400).json({ message: 'Signing link is invalid or has expired.' });
        }
        
        // Also fetch existing signatures for this document
        const signatures = await Signature.find({ documentId: doc._id });

        res.status(200).json({
            message: 'Document ready for signing.',
            document: {
                id: doc._id,
                filename: doc.filename,
                path: doc.path,
            },
            signatures: signatures,
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Signing link is invalid or has expired.' });
        }
        console.error('Error getting signing document:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};



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
        
        // Use fs.promises for async/await pattern
        await fs.promises.unlink(path.join(__dirname, '..', doc.path));
        
        // Also delete the signed version if it exists
        if (doc.signedPath) {
            await fs.promises.unlink(path.join(__dirname, '..', doc.signedPath)).catch(err => console.log("No signed file to delete, or error deleting:", err.message));
        }

        await Document.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Document deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Server error while deleting the document.' });
    }
};

exports.downloadSignedDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        // Anyone with the link can download, or add protect middleware for owner-only
        
        const signatures = await Signature.find({ documentId: doc._id });

        const pdfPath = path.join(__dirname, '..', doc.path);
        const existingPdfBytes = await fs.promises.readFile(pdfPath);
        
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
