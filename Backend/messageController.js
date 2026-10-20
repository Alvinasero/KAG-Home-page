const Message = require('../Models/Message');

// Get all contact messages (admin only)
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ created_at: -1 });
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Submit a new contact message (public)
exports.submitMessage = async (req, res) => {
    try {
        const newMessage = await Message.create({
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            content: req.body.message
        });
        res.status(201).json({ message: 'Message sent successfully', message: newMessage });
    } catch (err) {
        console.error('Failed to send message:', err);
        res.status(500).json({ message: 'Failed to send message', error: err.message });
    }
};

// Mark a message as read (admin only)
exports.markMessageAsRead = async (req, res) => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(req.params.id, { status: 'Read' }, { new: true });
        if (!updatedMessage) return res.status(404).json({ message: 'Message not found' });
        res.json({ message: 'Message marked as read', message: updatedMessage });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update message status', error: err.message });
    }
};

// Delete a message (admin only)
exports.deleteMessage = async (req, res) => {
    try {
        const deletedMessage = await Message.findByIdAndDelete(req.params.id);
        if (!deletedMessage) return res.status(404).json({ message: 'Message not found' });
        res.json({ message: 'Message permanently deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};