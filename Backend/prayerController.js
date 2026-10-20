const Prayer = require('../Models/Prayer');

// Get all prayer requests (admin only)
exports.getAllPrayerRequests = async (req, res) => {
    try {
        const prayers = await Prayer.find().sort({ created_at: -1 });
        res.json(prayers);
    } catch (err) {
        console.error('Error fetching prayer requests:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Submit a new prayer request (public)
exports.submitPrayerRequest = async (req, res) => {
    try {
        const newPrayer = await Prayer.create({
            member_name: req.body.name,
            phone_number: req.body.phone,
            request_type: req.body.type,
            message: req.body.message
        });
        res.status(201).json({ message: 'Prayer request submitted successfully', prayer: newPrayer });
    } catch (err) {
        console.error('Failed to save prayer request:', err);
        res.status(500).json({ message: 'Failed to save request', error: err.message });
    }
};

// Update prayer request status (admin only)
exports.updatePrayerStatus = async (req, res) => {
    try {
        const updatedPrayer = await Prayer.findByIdAndUpdate(req.params.id, { status: 'Prayed' }, { new: true });
        if (!updatedPrayer) return res.status(404).json({ message: 'Prayer request not found' });
        res.json({ message: 'Prayer request status updated', prayer: updatedPrayer });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update status', error: err.message });
    }
};

// Delete a prayer request (admin only)
exports.deletePrayerRequest = async (req, res) => {
    try {
        const deletedPrayer = await Prayer.findByIdAndDelete(req.params.id);
        if (!deletedPrayer) return res.status(404).json({ message: 'Prayer request not found' });
        res.json({ message: 'Prayer request permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};