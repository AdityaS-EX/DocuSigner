const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/document');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer file filter to accept only PDF files
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed.'), false); // Reject the file
  }
};

// Initialize Multer upload instance
// 'documentFile' is the field name that will be used in the form-data for the file
const upload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // Limit file size to 10MB (optional)
  }
}).single('documentFile'); // Expecting a single file with the field name 'documentFile'

const signedStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const signedDir = path.join(__dirname, '..', 'uploads', 'signed');
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }
    cb(null, signedDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadSigned = multer({
  storage: signedStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB limit
  }
}).single('signedFile');

exports.uploadSignedDocument = (req, res) => {
  uploadSigned(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No signed file uploaded.' });
    }

    try {
      const document = await Document.findById(req.params.documentId);
      if (!document) {
        return res.status(404).json({ message: 'Original document not found.' });
      }
      if (document.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'User not authorized.' });
      }

      document.signedPath = path.join('uploads', 'signed', req.file.filename);
      const savedDocument = await document.save();

      res.status(200).json({
        message: 'Signed document uploaded successfully.',
        document: savedDocument,
      });
    } catch (dbError) {
      console.error('Error updating document with signed path:', dbError);
      res.status(500).json({ message: 'Error saving signed document information.' });
    }
  });
};

// @desc    Upload a PDF document
// @route   POST /api/docs/upload
// @access  Private (Requires JWT Authentication)
exports.uploadDocument = (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading (e.g., file type validation error).
      return res.status(400).json({ message: err.message });
    }

    // If no file is uploaded or file is not present
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a PDF file.' });
    }

    // File uploaded successfully, now save metadata to MongoDB
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
      // Optionally, delete the uploaded file if DB save fails to prevent orphaned files
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting orphaned file:', unlinkErr);
      });
      res.status(500).json({ message: 'Error saving document metadata. Please try again.' });
    }
  });
};

// @desc    Get all documents for the authenticated user
// @route   GET /api/docs
// @access  Private (Requires JWT Authentication)
exports.getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching user documents:', error);
    res.status(500).json({ message: 'Server error while fetching documents.' });
  }
};

// @desc    Delete a document by its ID
// @route   DELETE /api/docs/:id
// @access  Private (Requires JWT Authentication)
exports.deleteDocument = async (req, res) => {
  try {
    const docId = req.params.id;
    const userId = req.user.id;

    // Find the document to ensure it exists and belongs to the user
    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Check if the document belongs to the requesting user
    if (document.user.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized. You do not have permission to delete this document.' });
    }

    // Path to the file on the server
    const filePath = path.join(uploadsDir, document.filename);

    // 1. Delete the file from the filesystem
    fs.unlink(filePath, async (err) => {
      if (err) {
        // Log the error but still proceed to delete the DB record.
        // The file might already be deleted or in an unexpected state.
        console.error(`Error deleting file ${filePath}:`, err);
        // Decide if you want to stop the process or not. For this case, we continue.
      }

      // 2. Delete the document from the database
      await Document.findByIdAndDelete(docId);

      // Optionally, delete associated signatures as well
      // await Signature.deleteMany({ documentId: docId });

      res.status(200).json({ message: 'Document deleted successfully.' });
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error while deleting the document.' });
  }
};
