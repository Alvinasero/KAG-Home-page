const Ministry = require('../Models/Ministry');

// Get all ministries (public)
exports.getAllMinistries = async (req, res) => {
    try {
        const ministries = await Ministry.find().populate('members', 'full_name email'); // Populate members if needed
        res.json(ministries);
    } catch (err) {
        console.error('Error fetching ministries:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get a single ministry by ID (public)
exports.getMinistryById = async (req, res) => {
    try {
        const ministry = await Ministry.findById(req.params.id).populate('members', 'full_name email');
        if (!ministry) return res.status(404).json({ message: 'Ministry not found' });
        res.json(ministry);
    } catch (err) {
        console.error('Error fetching ministry:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new ministry (admin only)
exports.createMinistry = async (req, res) => {
    try {
        const newMinistry = await Ministry.create(req.body);
        res.status(201).json({ message: 'Ministry created successfully', ministry: newMinistry });
    } catch (err) {
        console.error('Failed to create ministry:', err);
        res.status(500).json({ message: 'Failed to create ministry', error: err.message });
    }
};

// Update ministry details (admin only)
exports.updateMinistry = async (req, res) => {
    try {
        const updatedMinistry = await Ministry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMinistry) {
            return res.status(404).json({ message: 'Ministry not found' });
        }
        res.json({ message: 'Ministry updated successfully', ministry: updatedMinistry });
    } catch (err) {
        console.error('Failed to update ministry:', err);
        res.status(500).json({ message: 'Failed to update ministry', error: err.message });
    }
};

// Delete a ministry (admin only)
exports.deleteMinistry = async (req, res) => {
    try {
        const deletedMinistry = await Ministry.findByIdAndDelete(req.params.id);
        if (!deletedMinistry) return res.status(404).json({ message: 'Ministry not found' });
        res.json({ message: 'Ministry deleted successfully' });
    } catch (err) {
        console.error('Failed to delete ministry:', err);
        res.status(500).json({ message: 'Failed to delete ministry', error: err.message });
    }
};