const Donation = require('../Models/Donation');

// Get all donations (admin only)
exports.getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find().sort({ created_at: -1 });
        res.json(donations);
    } catch (err) {
        console.error('Error fetching donations:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get personal donation history for a logged-in member
exports.getMyDonations = async (req, res) => {
    try {
        // req.user is populated by the authenticateToken middleware
        // We filter by email which is stored in the User token or Member profile
        const donations = await Donation.find({ email: req.user.email }).sort({ created_at: -1 });
        res.json(donations);
    } catch (err) {
        console.error('Error fetching personal donations:', err);
        res.status(500).json({ message: 'Error fetching your donation history', error: err.message });
    }
};

// Create a new donation (public/user)
exports.createDonation = async (req, res) => {
    try {
        const newDonation = await Donation.create(req.body);
        res.status(201).json({ message: 'Donation recorded successfully', donation: newDonation });
    } catch (err) {
        console.error('Failed to record donation:', err);
        res.status(500).json({ message: 'Failed to record donation', error: err.message });
    }
};

// Update donation status (admin only)
exports.updateDonationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedDonation = await Donation.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!updatedDonation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        res.json({ message: 'Donation status updated successfully', donation: updatedDonation });
    } catch (err) {
        console.error('Failed to update donation status:', err);
        res.status(500).json({ message: 'Failed to update donation status', error: err.message });
    }
};

// Delete a donation (admin only)
exports.deleteDonation = async (req, res) => {
    try {
        const deletedDonation = await Donation.findByIdAndDelete(req.params.id);
        if (!deletedDonation) return res.status(404).json({ message: 'Donation not found' });
        res.json({ message: 'Donation deleted successfully' });
    } catch (err) {
        console.error('Failed to delete donation:', err);
        res.status(500).json({ message: 'Failed to delete donation', error: err.message });
    }
};