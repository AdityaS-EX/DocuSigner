
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name', 
  api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Configure multer to use Cloudinary for storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'docusigner_uploads', // A folder in your Cloudinary account
    allowed_formats: ['pdf'],
    resource_type: 'raw', // Treat PDFs as generic "raw" files for public access
  },
});

const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
};
