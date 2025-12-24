const multer = require('multer');
const path = require('path');

// where files go
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// allow common file types
function fileFilter(req, file, cb) {
  const allowed = /pdf|zip|rar|doc|docx|png|jpg|jpeg/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) cb(null, true);
  else cb(new Error('File type not supported'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

module.exports = upload;
