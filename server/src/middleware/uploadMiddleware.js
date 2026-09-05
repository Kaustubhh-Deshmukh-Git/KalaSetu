const multer = require('multer');

// Store file in memory buffer for immediate streaming to Cloudinary or local saving
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, PNG, and WebP images are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 5, // up to 5 photos per product
  },
});

const audioFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    const error = new Error('Invalid audio format. Please upload a valid voice recording file.');
    error.statusCode = 400;
    error.code = 'INVALID_AUDIO_FORMAT';
    cb(error, false);
  }
};

const uploadAudioMiddleware = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max for audio
  },
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 5),
  uploadAudio: uploadAudioMiddleware.single('audio'),
};
