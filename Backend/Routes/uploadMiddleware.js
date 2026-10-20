const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const { getUploadedFileUrl, isCloudinarySecureUrl, getErrorMessage } = require('../utils/helpers'); // Import helper functions

// Cloudinary Configuration (ensure this is loaded from .env in server.js and passed or re-configured here)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'kag_maridadi', // All uploads go into this folder
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        use_filename: true,
        unique_filename: true
    }),
});

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const createUpload = ({ allowedMimeTypes, maxFileSize }) => multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) {
            return cb(null, true);
        }
        const err = new Error(`Unsupported file type: ${file.mimetype}`);
        err.status = 400;
        return cb(err);
    }
});

// Helper to get upload error status (moved from server.js)
const getUploadErrorStatus = (err) => {
    if (err && err.status) return err.status;
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return 400;
    return 500;
};

const uploadSingle = (fieldName, options = {}) => (req, res, next) => {
    const upload = createUpload(options);

    upload.single(fieldName)(req, res, (err) => {
        if (err) {
            // If upload is optional and no file was provided, proceed
            if (options.optional && err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`Optional upload for ${fieldName} skipped: No file provided.`);
                }
                return next();
            }
            // Handle other errors
            const message = getErrorMessage(err, 'File upload failed');
            console.error(`Upload middleware failed for ${fieldName}:`, err);
            return res.status(getUploadErrorStatus(err)).json({ message: 'File upload failed', error: message });
        }
        next();
    });
};

module.exports = {
    uploadSingle,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
    IMAGE_MIME_TYPES,
    VIDEO_MIME_TYPES
};