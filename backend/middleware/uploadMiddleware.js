const multer = require('multer');
const path = require('path');

/**
 * Allowed file types (MIME + extension must match)
 */
const allowedTypes = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],

  // Spreadsheets and data files
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],

  // Presentation formats
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],

  // Code and config formats
  'text/plain': [
    '.txt', '.md', '.log',
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.java', '.c', '.cpp', '.cc', '.h', '.hpp', '.cs',
    '.go', '.php', '.rb', '.swift', '.kt', '.kts', '.scala', '.rs',
    '.sql', '.sh', '.bash', '.ps1', '.bat',
    '.html', '.css', '.scss', '.less', '.xml', '.yaml', '.yml', '.ini', '.conf',
  ],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
  'application/x-yaml': ['.yaml', '.yml'],
  'text/yaml': ['.yaml', '.yml'],

  // Images for UI/diagram/screenshots
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],

  // Archives
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'application/x-7z-compressed': ['.7z'],
  'application/x-rar-compressed': ['.rar'],
  'application/gzip': ['.gz'],
  'application/x-tar': ['.tar'],

  // Fallback for environments that report generic MIME for code/config files
  'application/octet-stream': [
    '.txt', '.md',
    '.js', '.jsx', '.ts', '.tsx',
    '.py', '.java', '.c', '.cpp', '.cc', '.h', '.hpp', '.cs',
    '.go', '.php', '.rb', '.swift', '.kt', '.kts', '.scala', '.rs',
    '.sql', '.sh', '.bash', '.ps1', '.bat',
    '.json', '.xml', '.yaml', '.yml',
    '.zip', '.7z', '.rar', '.tar', '.gz',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.pdf',
  ],
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
      new Error('Invalid file type. Allowed formats include docs, spreadsheets, presentations, archives, images, and common source/config files.'),
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
    fileSize: 25 * 1024 * 1024, // 25 MB limit
  },
});

// Pre-configured middleware for milestone deliverable submissions (up to 10 files)
const milestoneUpload = upload.array('milestoneFile', 10);

module.exports = upload;
module.exports.milestoneUpload = milestoneUpload;
