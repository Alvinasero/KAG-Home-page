const getErrorMessage = (err, fallback = 'Server error') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err.message) return err.message;

    try {
        return JSON.stringify(err);
    } catch {
        return fallback;
    }
};

const getUploadedFileUrl = (file) => {
    const url = file && (file.secure_url || file.path);
    if (!url || !url.startsWith('https://')) {
        throw new Error('Cloudinary upload did not return a secure URL');
    }
    return url;
};

const isCloudinarySecureUrl = (url) => (
    typeof url === 'string' &&
    url.startsWith('https://res.cloudinary.com/')
);

module.exports = { getErrorMessage, getUploadedFileUrl, isCloudinarySecureUrl };