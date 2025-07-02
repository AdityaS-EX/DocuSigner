const Audit = require('../models/audit');
const Document = require('../models/document');

exports.getAuditTrail = async (req, res) => {
  try {
    const { docId } = req.params;

    // 1. Validate the document ID
    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // 2. Ensure the user has permission (is the owner)
    if (doc.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You are not the owner of this document.' });
    }

    // 3. Fetch the audit logs that are not marked for deletion
    const logs = await Audit.find({ 
        documentId: docId,
        markedForDeletionAt: null 
    }).populate('userId', 'username email').sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID format.' });
    }
    res.status(500).json({ message: 'Server error retrieving audit trail.' });
  }
};

exports.clearAuditTrailForDocument = async (req, res) => {
    try {
        const { docId } = req.params;

        const doc = await Document.findById(docId);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this document.' });
        }
        
        // Set the deletion timestamp to 15 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 15);

        await Audit.updateMany(
            { documentId: docId },
            { $set: { markedForDeletionAt: deletionDate } }
        );

        res.status(200).json({ message: 'Audit trail has been cleared and will be permanently deleted in 15 days.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error clearing audit trail.' });
    }
};
