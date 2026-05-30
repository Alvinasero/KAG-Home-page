const Testimonial = require('../Models/Testimonial');

// Get all approved testimonials (public)
exports.getApprovedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ approved: true }).sort({ created_at: -1 });
        res.json(testimonials);
    } catch (err) {
        console.error('Error fetching approved testimonials:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all testimonials (admin only)
exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ created_at: -1 });
        res.json(testimonials);
    } catch (err) {
        console.error('Error fetching all testimonials:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Submit a new testimonial (public/user)
exports.submitTestimonial = async (req, res) => {
    try {
        const newTestimonial = await Testimonial.create(req.body); // 'approved' defaults to false
        res.status(201).json({ message: 'Testimonial submitted for review', testimonial: newTestimonial });
    } catch (err) {
        console.error('Failed to submit testimonial:', err);
        res.status(500).json({ message: 'Failed to submit testimonial', error: err.message });
    }
};

// Approve/Reject a testimonial (admin only)
exports.updateTestimonialStatus = async (req, res) => {
    try {
        const { approved } = req.body;
        const updatedTestimonial = await Testimonial.findByIdAndUpdate(req.params.id, { approved }, { new: true });
        if (!updatedTestimonial) return res.status(404).json({ message: 'Testimonial not found' });
        res.json({ message: 'Testimonial status updated', testimonial: updatedTestimonial });
    } catch (err) {
        console.error('Failed to update testimonial status:', err);
        res.status(500).json({ message: 'Failed to update testimonial status', error: err.message });
    }
};

// Delete a testimonial (admin only)
exports.deleteTestimonial = async (req, res) => {
    try {
        const deletedTestimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!deletedTestimonial) return res.status(404).json({ message: 'Testimonial not found' });
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error('Failed to delete testimonial:', err);
        res.status(500).json({ message: 'Failed to delete testimonial', error: err.message });
    }
};