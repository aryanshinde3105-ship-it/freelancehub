const multer = require('multer');
const path = require('path');

/**
 * Allowed file types (MIME + extension must match)
 */
const allowedTypes = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/zip': ['.zip'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      uniqueName + path.extname(file.originalname).toLowerCase()
    );
  },
});

/**
 * Secure file filter
 */
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  // Check MIME type
  if (!allowedTypes[mimeType]) {
    return cb(
      new Error('Invalid file type. Only PDF, images, or ZIP allowed.'),
      false
    );
  }

  // Check extension
  if (!allowedTypes[mimeType].includes(ext)) {
    return cb(
      new Error('File extension does not match file type.'),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

module.exports = upload;
