
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- PDF File Filter ---
const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
};

// --- Storage for Original Documents ---
const originalStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

exports.uploadOriginal = multer({
    storage: originalStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
}).single('documentFile');

// --- Storage for Signed Documents ---
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
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

exports.uploadSigned = multer({
    storage: signedStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 1024 * 1024 * 10 } // 10MB limit
}).any();
