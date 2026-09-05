const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const config = require('./env');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('[Cloudinary] Configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME || 'via CLOUDINARY_URL');
} else {
  console.log('[Cloudinary] No Cloudinary credentials found. Operating in local static upload fallback mode.');
}

// Local storage fallback directory
const UPLOADS_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Upload image buffer to Cloudinary or local dev storage fallback
 * @param {Buffer} buffer - File buffer from Multer
 * @param {string} originalname - Original file name
 * @param {string} folder - Folder/Namespace
 * @returns {Promise<{ url: string, publicId: string, provider: 'cloudinary' | 'local' }>}
 */
const uploadImage = async (buffer, originalname = 'photo.jpg', folder = 'kalasetu/products') => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            console.warn('[Cloudinary] Upload failed, falling back to local storage:', error.message);
            saveLocally(buffer, originalname)
              .then(resolve)
              .catch(reject);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              provider: 'cloudinary',
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Local fallback
  return saveLocally(buffer, originalname);
};

const saveLocally = async (buffer, originalname) => {
  const ext = path.extname(originalname) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, buffer);
  const localUrl = `/uploads/${filename}`;

  return {
    url: localUrl,
    publicId: filename,
    provider: 'local',
  };
};

module.exports = {
  cloudinary,
  uploadImage,
  isCloudinaryConfigured,
  UPLOADS_DIR,
};
