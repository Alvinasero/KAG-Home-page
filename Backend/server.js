const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
app.use(cors()); // Allows Admin and Frontend to talk to this server
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Allows handling of standard form submissions

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kag_maridadi';
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
    videoUrl: { type: String, required: true },
    speaker: String,
    category: String,
    createdAt: { type: Date, default: Date.now }
}));

const Prayer = mongoose.model('Prayer', new mongoose.Schema({
    member_name: String,
    phone_number: String,
    request_type: String,
    message: String,
    status: { type: String, default: 'Pending' },
    created_at: { type: Date, default: Date.now }
}));

const Event = mongoose.model('Event', new mongoose.Schema({
    title: String,
    event_date: Date,
    event_time: String,
    location: String,
    description: String
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

// Login Endpoint
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: User=${username}, Pwd=${password}`); // Debugging line
    if (username === 'admin' && password === 'admin@1234') {
        res.json({ token: 'SECRET_CHURCH_KEY_777', role: 'Admin' });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
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
            videoUrl: `/uploads/${req.file.filename}`,
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

// Public Data Endpoints
app.get('/api/sermons', async (req, res) => {
    try {
        const sermons = await Sermon.find().sort({ createdAt: -1 });
        res.json(sermons);
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
        res.status(500).json({ message: 'Failed' });
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

app.put('/api/admin/prayers/:id', async (req, res) => {
    try {
        await Prayer.findByIdAndUpdate(req.params.id, { status: 'Prayed' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});