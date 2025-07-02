const Audit = require('../models/audit');

const auditLog = (action) => async (req, res, next) => {
  try {
    const { id: documentId } = req.params;
    const userId = req.user ? req.user.id : null;
    const ip = req.ip;

    await Audit.create({
      documentId,
      userId,
      action,
      ip,
    });

    next();
  } catch (error) {
    console.error('Audit log error:', error);
    next(error);
  }
};

module.exports = auditLog;
