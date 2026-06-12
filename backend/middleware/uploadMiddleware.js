const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Create upload directories if they don't exist
['uploads/notes', 'uploads/assignments', 'uploads/resumes'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, `uploads/${folder}`),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|ppt|pptx|txt|png|jpg|jpeg|zip/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  allowed.test(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
};

const uploadNote       = multer({ storage: storage('notes'),       fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');
const uploadAssignment = multer({ storage: storage('assignments'), fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).single('file');
const uploadResume     = multer({ storage: storage('resumes'),     fileFilter, limits: { fileSize: 5  * 1024 * 1024 } }).single('file');

module.exports = { uploadNote, uploadAssignment, uploadResume };
