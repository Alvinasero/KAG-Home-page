const Event = require('../Models/Event');
const cloudinary = require('cloudinary').v2;
const { getUploadedFileUrl, isCloudinarySecureUrl, getErrorMessage } = require('../utils/helpers'); // Assuming a helpers file

// Get all events (public)
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ event_date: 1 });
        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get a single event by ID (public)
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new event (admin only)
exports.createEvent = async (req, res) => {
    try {
        const eventData = {
            title: req.body.title,
            event_date: req.body.event_date,
            event_time: req.body.event_time,
            location: req.body.location,
            description: req.body.description,
            is_featured: req.body.is_featured || false
        };

        if (req.file) {
            eventData.image_poster = getUploadedFileUrl(req.file);
        } else if (req.body.image_poster) {
            if (!isCloudinarySecureUrl(req.body.image_poster)) {
                return res.status(400).json({ message: 'Invalid Cloudinary image URL' });
            }
            eventData.image_poster = req.body.image_poster;
        }

        const event = await Event.create(eventData);
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error('Failed to create event:', err);
        res.status(500).json({ message: 'Failed to create event', error: getErrorMessage(err) });
    }
};

// Update an event (admin only)
exports.updateEvent = async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEvent) return res.status(404).json({ message: 'Event not found' });
        res.json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (err) {
        console.error('Failed to update event:', err);
        res.status(500).json({ message: 'Failed to update event', error: getErrorMessage(err) });
    }
};

// Delete an event (admin only)
exports.deleteEvent = async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) return res.status(404).json({ message: 'Event not found' });
        // TODO: Add Cloudinary deletion logic here if image_poster exists
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Event delete failed:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};