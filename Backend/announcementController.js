const Announcement = require('../Models/Announcement');

// Get all announcements (public)
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ created_at: -1 });
        res.json(announcements);
    } catch (err) {
        console.error('Error fetching announcements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new announcement (admin only)
exports.createAnnouncement = async (req, res) => {
    try {
        const newAnnouncement = await Announcement.create(req.body);
        res.status(201).json({ message: 'Announcement posted successfully', announcement: newAnnouncement });
    } catch (err) {
        console.error('Failed to post announcement:', err);
        res.status(500).json({ message: 'Failed to post announcement', error: err.message });
    }
};

// Update an announcement (admin only)
exports.updateAnnouncement = async (req, res) => {
    try {
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAnnouncement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.json({ message: 'Announcement updated successfully', announcement: updatedAnnouncement });
    } catch (err) {
        console.error('Failed to update announcement:', err);
        res.status(500).json({ message: 'Failed to update announcement', error: err.message });
    }
};

// Delete an announcement (admin only)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const deletedAnnouncement = await Announcement.findByIdAndDelete(req.params.id);
        if (!deletedAnnouncement) return res.status(404).json({ message: 'Announcement not found' });
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        console.error('Announcement delete failed:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};