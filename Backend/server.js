const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors()); // Allows Admin and Frontend to talk to this server
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows handling of standard form submissions

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kag_maridadi';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/uploads', express.static(uploadDir));

// Serve Frontend and Admin static files for "Live" deployment
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/admin-panel', express.static(path.join(__dirname, '../Admin')));

// Database Schemas & Models
const Sermon = mongoose.model('Sermon', new mongoose.Schema({
    title: { type: String, required: true },
    video_url: { type: String, required: true },
    speaker: String,
    category: String,
    created_at: { type: Date, default: Date.now }
}));

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Admin' }
}));

const Prayer = mongoose.model('Prayer', new mongoose.Schema({
    member_name: String,
    phone_number: String,
    request_type: String,
    message: String,
    status: { type: String, default: 'Pending' },
    created_at: { type: Date, default: Date.now }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    content: String,
    status: { type: String, default: 'Unread' },
    created_at: { type: Date, default: Date.now }
}));

const Event = mongoose.model('Event', new mongoose.Schema({
    title: String,
    event_date: Date,
    event_time: String,
    location: String,
    description: String,
    is_featured: { type: Boolean, default: false },
    image_poster: String
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
}));

const Blog = mongoose.model('Blog', new mongoose.Schema({
    title: String,
    category: String,
    content: String,
    image: String,
    published_at: { type: Date, default: Date.now }
}));

const Gallery = mongoose.model('Gallery', new mongoose.Schema({
    image_path: String,
    caption: String,
    category: String
}));

// Authentication Endpoints
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // First check database for registered users
        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            return res.json({ token: 'SECRET_CHURCH_KEY_777', role: 'Admin' });
        }

        // Fallback for hardcoded admin during initial migration
        if (username === 'admin' && password === 'admin@1234') {
            return res.json({ token: 'SECRET_CHURCH_KEY_777', role: 'Admin' });
        }

        res.status(401).json({ message: 'Invalid username or password' });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/admin/register', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ name, username, password: hashedPassword });
        
        res.status(201).json({ message: 'Administrator account created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// Password Recovery Helper
app.get('/api/admin/recovery-info', (req, res) => {
    res.json({ 
        message: 'Administrator credentials are currently managed in the backend configuration.',
        supportEmail: 'tech-support@kagmaridadi.org'
    });
});

// Upload Endpoint
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Unified Sermon Upload Handler
const handleSermonUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }
    try {
        const newSermon = await Sermon.create({ 
            title: req.body.title, 
            video_url: `/uploads/${req.file.filename}`,
            speaker: req.body.speaker || 'KAG Maridadi',
            category: req.body.category || 'General'
        });
        res.json({ message: 'Upload success', sermon: newSermon });
    } catch (err) {
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
};

app.post('/api/admin/upload', upload.single('video'), handleSermonUpload);
app.post('/api/admin/sermons', upload.single('sermonFile'), handleSermonUpload);

// Delete Sermon Endpoint
app.delete('/api/admin/sermons/:id', async (req, res) => {
    try {
        const sermon = await Sermon.findById(req.params.id);
        if (!sermon) return res.status(404).json({ message: 'Sermon not found' });

        // Delete the actual file from disk
        const fileName = path.basename(sermon.video_url);
        const fullPath = path.join(uploadDir, fileName);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await Sermon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Sermon deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
});

// Announcement Management
app.post('/api/admin/announcements', async (req, res) => {
    try {
        const announcement = await Announcement.create(req.body);
        res.json({ message: 'Announcement posted', announcement });
    } catch (err) {
        res.status(500).json({ message: 'Failed to post announcement' });
    }
});

app.delete('/api/admin/announcements/:id', async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

// Public Data Endpoints
app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await Sermon.find().sort({ created_at: -1 });
        res.json(sermons);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/announcements', async (req, res) => {
    try {
        const list = await Announcement.find().sort({ created_at: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ event_date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/blog', async (req, res) => {
    try {
        const posts = await Blog.find().sort({ published_at: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/gallery', async (req, res) => {
    try {
        const category = req.query.category;
        const filter = category && category !== 'All' ? { category } : {};
        const items = await Gallery.find(filter);
        res.json(items);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Prayer Request Endpoints
app.post('/api/prayer-request', async (req, res) => {
    try {
        await Prayer.create({
            member_name: req.body.name,
            phone_number: req.body.phone,
            request_type: req.body.type,
            message: req.body.message
        });
        res.status(201).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save request', error: err.message });
    }
});

// General Contact Message Endpoints
app.post('/api/contact-message', async (req, res) => {
    try {
        await Message.create({
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            content: req.body.message
        });
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send message' });
    }
});

app.get('/api/admin/prayers', async (req, res) => {
    try {
        const prayers = await Prayer.find().sort({ created_at: -1 });
        res.json(prayers);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/admin/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ created_at: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.put('/api/admin/messages/:id', async (req, res) => {
    try {
        await Message.findByIdAndUpdate(req.params.id, { status: 'Read' });
        res.json({ message: 'Message marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

app.put('/api/admin/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndUpdate(req.params.id, { status: 'Prayed' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err.message);
});