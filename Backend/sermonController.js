const Sermon = require('../Models/Sermon');
const cloudinary = require('cloudinary').v2;
const { getUploadedFileUrl, isCloudinarySecureUrl, getErrorMessage } = require('../utils/helpers'); // Assuming a helpers file

// Get all sermons (public)
exports.getAllSermons = async (req, res) => {
    try {
        const sermons = await Sermon.find().sort({ created_at: -1 });
        res.json(sermons);
    } catch (err) {
        console.error('Error fetching sermons:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get a single sermon by ID (public)
exports.getSermonById = async (req, res) => {
    try {
        const sermon = await Sermon.findById(req.params.id);
        if (!sermon) return res.status(404).json({ message: 'Sermon not found' });
        res.json(sermon);
    } catch (err) {
        console.error('Error fetching sermon:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new sermon (admin only) - handles both file upload and direct URL
exports.createSermon = async (req, res) => {
    try {
        if (!req.file && !req.body.video_url) {
            return res.status(400).json({ message: 'No video file or URL provided' });
        }

        let videoUrl;
        if (req.file) {
            videoUrl = getUploadedFileUrl(req.file);
        } else if (req.body.video_url) {
            if (!isCloudinarySecureUrl(req.body.video_url)) {
                return res.status(400).json({ message: 'Invalid Cloudinary video URL' });
            }
            videoUrl = req.body.video_url;
        }

        const newSermon = await Sermon.create({
            title: req.body.title,
            video_url: videoUrl,
            speaker: req.body.speaker || 'KAG Maridadi Church',
            category: req.body.category || 'General',
            description: req.body.description
        });
        res.status(201).json({ message: 'Sermon created successfully', sermon: newSermon });
    } catch (err) {
        console.error('Failed to create sermon:', err);
        res.status(500).json({ message: 'Failed to create sermon', error: getErrorMessage(err) });
    }
};

// Update a sermon (admin only)
exports.updateSermon = async (req, res) => {
    try {
        const updatedSermon = await Sermon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSermon) return res.status(404).json({ message: 'Sermon not found' });
        res.json({ message: 'Sermon updated successfully', sermon: updatedSermon });
    } catch (err) {
        console.error('Failed to update sermon:', err);
        res.status(500).json({ message: 'Failed to update sermon', error: getErrorMessage(err) });
    }
};

// Delete a sermon (admin only)
exports.deleteSermon = async (req, res) => {
    try {
        const deletedSermon = await Sermon.findByIdAndDelete(req.params.id);
        if (!deletedSermon) return res.status(404).json({ message: 'Sermon not found' });
        // TODO: Add Cloudinary deletion logic here if video_url exists
        res.json({ message: 'Sermon deleted successfully' });
    } catch (err) {
        console.error('Sermon delete failed:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};