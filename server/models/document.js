const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shareToken: String,
    shareTokenExpires: Date,
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
