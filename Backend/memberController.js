const Member = require('../Models/Member');

// Get all members (admin only)
exports.getAllMembers = async (req, res) => {
    try {
        const members = await Member.find().populate('user', 'username email'); // Populate user details if linked
        res.json(members);
    } catch (err) {
        console.error('Error fetching members:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get a single member by ID (admin only)
exports.getMemberById = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id).populate('user', 'username email');
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (err) {
        console.error('Error fetching member:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Register a new member (public/user)
exports.registerMember = async (req, res) => {
    try {
        const newMember = await Member.create(req.body);
        res.status(201).json({ message: 'Membership registered successfully', member: newMember });
    } catch (err) {
        console.error('Failed to register member:', err);
        res.status(500).json({ message: 'Failed to register member', error: err.message });
    }
};

// Update member details (admin/member self-service)
exports.updateMember = async (req, res) => {
    try {
        const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMember) {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.json({ message: 'Member updated successfully', member: updatedMember });
    } catch (err) {
        console.error('Failed to update member:', err);
        res.status(500).json({ message: 'Failed to update member', error: err.message });
    }
};

// Delete a member (admin only)
exports.deleteMember = async (req, res) => {
    try {
        const deletedMember = await Member.findByIdAndDelete(req.params.id);
        if (!deletedMember) return res.status(404).json({ message: 'Member not found' });
        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        console.error('Failed to delete member:', err);
        res.status(500).json({ message: 'Failed to delete member', error: err.message });
    }
};