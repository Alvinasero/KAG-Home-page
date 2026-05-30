const Gallery = require('../Models/Gallery');
const cloudinary = require('cloudinary').v2;
const { getUploadedFileUrl, isCloudinarySecureUrl, getErrorMessage } = require('../utils/helpers'); // Assuming a helpers file

// Get all gallery items (public)
exports.getAllGalleryItems = async (req, res) => {
    try {
        const category = req.query.category;
        const filter = category && category !== 'All' ? { category } : {};
        const items = await Gallery.find(filter).sort({ created_at: -1 });
        res.json(items);
    } catch (err) {
        console.error('Error fetching gallery items:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new gallery item (admin only)
exports.createGalleryItem = async (req, res) => {
    try {
        if (!req.file && !req.body.image_path) {
            return res.status(400).json({ message: 'No image file or URL provided' });
        }

        let imageUrl;
        if (req.file) {
            imageUrl = getUploadedFileUrl(req.file);
        } else if (req.body.image_path) {
            if (!isCloudinarySecureUrl(req.body.image_path)) {
                return res.status(400).json({ message: 'Invalid Cloudinary image URL' });
            }
            imageUrl = req.body.image_path;
        }

        const item = await Gallery.create({
            image_path: imageUrl,
            caption: req.body.caption,
            category: req.body.category || 'General'
        });
        res.status(201).json({ message: 'Gallery item added successfully', item });
    } catch (err) {
        console.error('Failed to add gallery item:', err);
        res.status(500).json({ message: 'Failed to add gallery item', error: getErrorMessage(err) });
    }
};

// Delete a gallery item (admin only)
exports.deleteGalleryItem = async (req, res) => {
    try {
        const item = await Gallery.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Gallery item not found' });

        // Delete from Cloudinary if it's a Cloudinary URL
        if (item.image_path && item.image_path.startsWith('https://res.cloudinary.com')) {
            try {
                const publicId = item.image_path.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`kag_maridadi/${publicId}`);
            } catch (cloudinaryErr) {
                console.error('Failed to delete Cloudinary image:', cloudinaryErr);
            }
        }
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gallery item deleted successfully' });
    } catch (err) {
        console.error('Gallery item delete failed:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};