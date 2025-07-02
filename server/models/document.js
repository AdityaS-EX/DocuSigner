const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    path: { // This will now store the Cloudinary URL
        type: String,
        required: true,
    },
    cloudinaryPublicId: { // To store the public_id from Cloudinary
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    shareToken: String, // This and the expires field are now deprecated but kept for safety
    shareTokenExpires: Date,
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
